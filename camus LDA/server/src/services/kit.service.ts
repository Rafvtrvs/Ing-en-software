import { prisma } from '../db/prisma.js'
import { auditService } from './audit.service.js'

export interface KitItemInput {
  productId: string | number
  quantity: number
}

export interface KitInput {
  name: string
  description?: string
  status?: string
  items: KitItemInput[]
}

function toKitDto(
  kit: {
    id: number
    nombre: string
    descripcion: string
    estado: string
    items: Array<{
      idInsumo: number
      cantidad: number
      insumo: { id: number; nombre: string; unidad: string; codigo: string } | null
    }>
  },
) {
  return {
    id: String(kit.id),
    name: kit.nombre,
    description: kit.descripcion ?? '',
    status: kit.estado === 'Inactivo' ? 'Inactivo' : 'Activo',
    items: kit.items.map((item) => ({
      productId: String(item.idInsumo),
      productName: item.insumo?.nombre ?? `Insumo ${item.idInsumo}`,
      productCode: item.insumo?.codigo ?? '',
      quantity: item.cantidad,
      unit: item.insumo?.unidad || 'un',
    })),
  }
}

async function assertValidItems(items: KitItemInput[]) {
  if (!Array.isArray(items) || items.length === 0) {
    const e = new Error('El kit debe incluir al menos un producto') as Error & {
      status: number
    }
    e.status = 400
    throw e
  }

  const seen = new Set<number>()
  const normalized: Array<{ idInsumo: number; cantidad: number }> = []

  for (const raw of items) {
    const idInsumo = Number(raw.productId)
    const cantidad = Math.max(1, Math.floor(Number(raw.quantity) || 1))
    if (!Number.isFinite(idInsumo) || idInsumo <= 0) {
      const e = new Error('Producto inválido en el kit') as Error & { status: number }
      e.status = 400
      throw e
    }
    if (seen.has(idInsumo)) {
      const e = new Error('No se puede repetir el mismo producto en el kit') as Error & {
        status: number
      }
      e.status = 400
      throw e
    }
    seen.add(idInsumo)
    normalized.push({ idInsumo, cantidad })
  }

  const found = await prisma.insumo.findMany({
    where: { id: { in: normalized.map((i) => i.idInsumo) } },
    select: { id: true },
  })
  if (found.length !== normalized.length) {
    const e = new Error('Uno o más productos del kit no existen en inventario') as Error & {
      status: number
    }
    e.status = 400
    throw e
  }

  return normalized
}

const includeItems = {
  items: {
    include: { insumo: true },
    orderBy: { idInsumo: 'asc' as const },
  },
}

export const kitService = {
  async list() {
    const rows = await prisma.kit.findMany({
      include: includeItems,
      orderBy: { id: 'desc' },
    })
    return rows.map(toKitDto)
  },

  async create(input: KitInput, userId?: number) {
    const name = input.name?.trim()
    if (!name) {
      const e = new Error('El nombre del kit es obligatorio') as Error & { status: number }
      e.status = 400
      throw e
    }

    const items = await assertValidItems(input.items ?? [])
    const row = await prisma.kit.create({
      data: {
        nombre: name.slice(0, 100),
        descripcion: (input.description ?? '').trim().slice(0, 255),
        estado: input.status === 'Inactivo' ? 'Inactivo' : 'Activo',
        items: {
          create: items.map((i) => ({
            idInsumo: i.idInsumo,
            cantidad: i.cantidad,
          })),
        },
      },
      include: includeItems,
    })

    await auditService.log({
      modulo: 'inventario',
      accion: 'crear-kit',
      valorNuevo: row,
      idUsuario: userId,
    })

    return toKitDto(row)
  },

  async update(id: number, input: Partial<KitInput>, userId?: number) {
    const before = await prisma.kit.findUnique({
      where: { id },
      include: includeItems,
    })
    if (!before) {
      const e = new Error('Kit no encontrado') as Error & { status: number }
      e.status = 404
      throw e
    }

    const items =
      input.items !== undefined ? await assertValidItems(input.items) : null

    const row = await prisma.$transaction(async (tx) => {
      if (items) {
        await tx.kitItem.deleteMany({ where: { idKit: id } })
        await tx.kitItem.createMany({
          data: items.map((i) => ({
            idKit: id,
            idInsumo: i.idInsumo,
            cantidad: i.cantidad,
          })),
        })
      }

      return tx.kit.update({
        where: { id },
        data: {
          ...(input.name !== undefined
            ? { nombre: input.name.trim().slice(0, 100) }
            : {}),
          ...(input.description !== undefined
            ? { descripcion: input.description.trim().slice(0, 255) }
            : {}),
          ...(input.status !== undefined
            ? { estado: input.status === 'Inactivo' ? 'Inactivo' : 'Activo' }
            : {}),
        },
        include: includeItems,
      })
    })

    await auditService.log({
      modulo: 'inventario',
      accion: 'actualizar-kit',
      valorAnterior: before,
      valorNuevo: row,
      idUsuario: userId,
    })

    return toKitDto(row)
  },

  async remove(id: number, userId?: number) {
    const before = await prisma.kit.findUnique({
      where: { id },
      include: includeItems,
    })
    if (!before) {
      const e = new Error('Kit no encontrado') as Error & { status: number }
      e.status = 404
      throw e
    }

    await prisma.kit.delete({ where: { id } })
    await auditService.log({
      modulo: 'inventario',
      accion: 'eliminar-kit',
      valorAnterior: before,
      idUsuario: userId,
    })

    return { ok: true as const }
  },
}
