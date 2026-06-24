// ============================================================
//  AssetService (Lógica del negocio)  -> AssetController
//  Gestiona insumos/inventario (activos). Calcula el estado de stock.
// ============================================================
import { prisma } from '../db/prisma.js'
import { auditService } from './audit.service.js'
import { toAssetDto } from './mappers.js'
import { assertNoDuplicateProductCode } from '../utils/productDuplicates.js'

interface AssetInput {
  code?: string
  name: string
  currentStock?: number
  minStock?: number
  unit?: string
  category?: string
  idProveedor?: number
}

function computeStatus(current: number, min: number): string {
  if (current <= min) return 'Crítico'
  if (current <= min * 1.5) return 'Bajo'
  return 'Ok'
}

// Resuelve el id de categoría a partir del nombre que envía la Vista.
// Si no existe, la crea (mantiene el catálogo en sincronía).
async function resolveCategoria(name?: string): Promise<number | null> {
  if (!name) return null
  const existing = await prisma.categoriaInsumo.findFirst({
    where: { nombre: name },
  })
  if (existing) return existing.id
  const created = await prisma.categoriaInsumo.create({ data: { nombre: name } })
  return created.id
}

export const assetService = {
  async list() {
    const rows = await prisma.insumo.findMany({
      orderBy: { nombre: 'asc' },
      include: { categoria: true },
    })
    return rows.map(toAssetDto)
  },

  async create(input: AssetInput, userId?: number) {
    const existing = await prisma.insumo.findMany()
    assertNoDuplicateProductCode(existing, input.code ?? '')

    const estado = computeStatus(input.currentStock ?? 0, input.minStock ?? 0)
    const idCategoria = await resolveCategoria(input.category)
    const row = await prisma.insumo.create({
      data: {
        codigo: input.code ?? '',
        nombre: input.name,
        stockActual: input.currentStock ?? 0,
        stockMinimo: input.minStock ?? 0,
        unidad: input.unit ?? 'unidad',
        estado,
        idCategoria,
        idProveedor: input.idProveedor ?? null,
      },
      include: { categoria: true },
    })
    await auditService.log({
      modulo: 'inventario',
      accion: 'crear',
      valorNuevo: row,
      idUsuario: userId,
    })
    return toAssetDto(row)
  },

  async update(id: number, input: Partial<AssetInput>, userId?: number) {
    const before = await prisma.insumo.findUnique({ where: { id } })
    if (!before) {
      const err = new Error('Producto no encontrado') as Error & { status: number }
      err.status = 404
      throw err
    }

    const code = input.code ?? before.codigo
    const existing = await prisma.insumo.findMany()
    assertNoDuplicateProductCode(existing, code, id)

    const current = input.currentStock ?? before.stockActual ?? 0
    const min = input.minStock ?? before?.stockMinimo ?? 0
    const idCategoria =
      input.category !== undefined
        ? await resolveCategoria(input.category)
        : undefined
    const row = await prisma.insumo.update({
      where: { id },
      data: {
        codigo: input.code,
        nombre: input.name,
        stockActual: input.currentStock,
        stockMinimo: input.minStock,
        unidad: input.unit,
        estado: computeStatus(current, min),
        idCategoria,
        idProveedor: input.idProveedor,
      },
      include: { categoria: true },
    })
    await auditService.log({
      modulo: 'inventario',
      accion: 'actualizar',
      valorAnterior: before,
      valorNuevo: row,
      idUsuario: userId,
    })
    return toAssetDto(row)
  },

  async remove(id: number, userId?: number) {
    const before = await prisma.insumo.findUnique({ where: { id } })
    await prisma.insumo.delete({ where: { id } })
    await auditService.log({
      modulo: 'inventario',
      accion: 'eliminar',
      valorAnterior: before,
      idUsuario: userId,
    })
  },
}
