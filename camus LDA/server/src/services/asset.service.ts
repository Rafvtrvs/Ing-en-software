// ============================================================
//  AssetService (Lógica del negocio)  -> AssetController
//  Gestiona insumos/inventario (activos). Calcula el estado de stock.
// ============================================================
import { prisma } from '../db/prisma.js'
import { auditService } from './audit.service.js'
import { toAssetDto } from './mappers.js'
import { assertNoDuplicateProductCode } from '../utils/productDuplicates.js'
import { nextProductCode } from '../utils/productCode.js'
import {
  isMachineryCategory,
  toMachineryCategoryLabel,
} from '../utils/machineryCategory.js'
import { isConsumableStockCategory } from '../utils/stockCategories.js'
import { machineryService } from './machinery.service.js'

interface AssetInput {
  code?: string
  name: string
  currentStock?: number
  minStock?: number
  unit?: string
  /** Costo unitario de adquisición (CLP) */
  unitCost?: number
  category?: string
  idProveedor?: number
}

function normalizeUnitCost(value?: number): number {
  if (value == null || !Number.isFinite(value) || value < 0) return 0
  return Math.round(value * 100) / 100
}

function computeStatus(current: number, min: number, category?: string): string {
  if (category && !isConsumableStockCategory(category)) return 'Ok'
  if (current <= 0 || current < min * 0.5) return 'Crítico'
  if (current <= min) return 'Bajo'
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
    const existing = await prisma.insumo.findMany({ include: { categoria: true } })
    const categoryName = input.category?.trim() || 'Insumos'
    const codigo =
      input.code?.trim() || nextProductCode(existing, categoryName)
    assertNoDuplicateProductCode(existing, codigo)

    const estado = computeStatus(
      input.currentStock ?? 0,
      input.minStock ?? 0,
      categoryName,
    )
    const idCategoria = await resolveCategoria(categoryName)
    const stockActual = input.currentStock ?? 0
    const row = await prisma.insumo.create({
      data: {
        codigo,
        nombre: input.name,
        stockActual,
        stockMinimo: input.minStock ?? 0,
        unidad: input.unit ?? 'unidad',
        costoUnitario: normalizeUnitCost(input.unitCost),
        estado,
        idCategoria,
        idProveedor: input.idProveedor ?? null,
      },
      include: { categoria: true },
    })

    if (stockActual > 0) {
      await prisma.movimientoStock.create({
        data: {
          idInsumo: row.id,
          tipo: 'Entrada',
          cantidad: stockActual,
          detalle: `Alta de producto ${row.codigo}`,
          usuario: 'Sistema',
        },
      })
    }

    await auditService.log({
      modulo: 'inventario',
      accion: 'crear',
      valorNuevo: row,
      idUsuario: userId,
    })

    // RF67: productos de flota/maquinaria también entran a disponibilidad
    if (isMachineryCategory(categoryName)) {
      try {
        await machineryService.ensureFromAsset({
          code: row.codigo,
          name: row.nombre,
          category: toMachineryCategoryLabel(categoryName),
          status: 'Operativo',
        })
      } catch (err) {
        console.error('[asset] no se pudo registrar maquinaria para', row.codigo, err)
      }
    }

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
    let categoryName = input.category?.trim() ?? ''
    if (!categoryName && before.idCategoria != null) {
      const cat = await prisma.categoriaInsumo.findUnique({
        where: { id: before.idCategoria },
      })
      categoryName = cat?.nombre ?? ''
    }
    const row = await prisma.insumo.update({
      where: { id },
      data: {
        codigo: input.code,
        nombre: input.name,
        stockActual: input.currentStock,
        stockMinimo: input.minStock,
        unidad: input.unit,
        ...(input.unitCost !== undefined
          ? { costoUnitario: normalizeUnitCost(input.unitCost) }
          : null),
        estado: computeStatus(current, min, categoryName),
        idCategoria,
        idProveedor: input.idProveedor,
      },
      include: { categoria: true },
    })

    const previousStock = before.stockActual ?? 0
    if (input.currentStock !== undefined && current !== previousStock) {
      const delta = current - previousStock
      await prisma.movimientoStock.create({
        data: {
          idInsumo: id,
          tipo: delta > 0 ? 'Entrada' : 'Salida',
          cantidad: Math.abs(delta),
          detalle: `Ajuste de stock en ficha (${previousStock} → ${current})`,
          usuario: 'Sistema',
        },
      })
    }

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
