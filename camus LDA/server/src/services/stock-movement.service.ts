import { prisma } from '../db/prisma.js'
import { auditService } from './audit.service.js'
import { toAssetDto } from './mappers.js'
import { isConsumableStockCategory } from '../utils/stockCategories.js'

export interface StockMovementInput {
  productId: string | number
  type: 'Entrada' | 'Salida'
  quantity: number
  detail?: string
  orderId?: string
  user?: string
}

function computeStatus(current: number, min: number, category?: string): string {
  if (category && !isConsumableStockCategory(category)) return 'Ok'
  if (current <= 0 || current < min * 0.5) return 'Crítico'
  if (current <= min) return 'Bajo'
  return 'Ok'
}

function toMovementDto(row: {
  id: number
  idInsumo: number
  tipo: string
  cantidad: number
  detalle: string
  usuario: string
  idOt: string | null
  fecha: Date
  insumo?: { nombre: string; codigo: string } | null
}) {
  return {
    id: String(row.id),
    productId: String(row.idInsumo),
    product: row.insumo?.nombre ?? `Insumo ${row.idInsumo}`,
    productCode: row.insumo?.codigo ?? '',
    type: row.tipo === 'Entrada' ? 'Entrada' : 'Salida',
    quantity: row.cantidad,
    detail: row.detalle,
    user: row.usuario,
    orderId: row.idOt ?? undefined,
    date: row.fecha.toLocaleString('es-CL'),
    createdAt: row.fecha.toISOString(),
  }
}

function httpError(message: string, status: number) {
  const err = new Error(message) as Error & { status: number }
  err.status = status
  return err
}

export const stockMovementService = {
  async list() {
    const rows = await prisma.movimientoStock.findMany({
      orderBy: { fecha: 'desc' },
      include: { insumo: { select: { nombre: true, codigo: true } } },
      take: 500,
    })
    return rows.map(toMovementDto)
  },

  async create(input: StockMovementInput, userId?: number) {
    const productId = Number(input.productId)
    const quantity = Math.floor(Number(input.quantity))
    const type = input.type === 'Entrada' ? 'Entrada' : 'Salida'

    if (!Number.isFinite(productId) || productId <= 0) {
      throw httpError('Producto inválido', 400)
    }
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw httpError('La cantidad debe ser mayor a cero', 400)
    }

    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.insumo.findUnique({
        where: { id: productId },
        include: { categoria: true },
      })
      if (!product) throw httpError('Producto no encontrado en inventario', 404)

      if (type === 'Salida' && product.stockActual < quantity) {
        throw httpError(
          `Stock insuficiente para "${product.nombre}": disponible ${product.stockActual}, solicitado ${quantity}`,
          400,
        )
      }

      const currentStock =
        type === 'Salida'
          ? Math.max(0, product.stockActual - quantity)
          : product.stockActual + quantity
      const categoryName = product.categoria?.nombre ?? ''
      const estado = computeStatus(currentStock, product.stockMinimo, categoryName)

      const updated = await tx.insumo.update({
        where: { id: productId },
        data: { stockActual: currentStock, estado },
        include: { categoria: true },
      })

      const detail =
        input.detail?.trim() ||
        (type === 'Salida'
          ? input.orderId
            ? `Uso en OT ${input.orderId}`
            : 'Uso en orden de trabajo'
          : input.orderId
            ? `Devolución por baja de insumo en OT ${input.orderId}`
            : 'Entrada de inventario')

      const movement = await tx.movimientoStock.create({
        data: {
          idInsumo: productId,
          tipo: type,
          cantidad: quantity,
          detalle: detail.slice(0, 255),
          usuario: (input.user?.trim() || 'Sistema').slice(0, 120),
          idOt: input.orderId?.trim() || null,
        },
        include: { insumo: { select: { nombre: true, codigo: true } } },
      })

      return { movement, product: updated }
    })

    await auditService.log({
      modulo: 'inventario',
      accion: type === 'Salida' ? 'salida_stock' : 'entrada_stock',
      valorNuevo: result.movement,
      idUsuario: userId,
    })

    return {
      movement: toMovementDto(result.movement),
      product: toAssetDto(result.product),
    }
  },
}
