// ============================================================
//  EstimateService — costos y estimaciones (RF16 / CU-60 y CU-61)
//  CU-60: calcula costo de insumos, maquinaria, combustible y personal (+ IVA).
//  CU-61: guarda y entrega estimaciones para presentarlas al cliente.
// ============================================================
import { prisma } from '../db/prisma.js'
import { auditService } from './audit.service.js'

export class EstimateError extends Error {
  status: number
  field?: string

  constructor(status: number, message: string, field?: string) {
    super(message)
    this.name = 'EstimateError'
    this.status = status
    this.field = field
  }
}

export const RATE_TYPES = ['insumo', 'maquinaria', 'combustible', 'personal'] as const
export type RateType = (typeof RATE_TYPES)[number]
export const DEFAULT_TAX_RATE = 19

export interface RateDto {
  id: number
  type: RateType
  name: string
  unit: string
  unitPrice: number
}

export interface EstimateLine {
  rateId: number
  type: RateType
  name: string
  unit: string
  unitPrice: number
  quantity: number
  amount: number
}

export interface EstimateTotals {
  lines: EstimateLine[]
  subtotal: number
  taxRate: number
  tax: number
  total: number
}

export interface EstimateDto extends EstimateTotals {
  id: number
  description: string
  createdAt: string
}

type RateRow = { id: number; tipo: string; nombre: string; unidad: string; valorUnitario: unknown }

function toRateDto(r: RateRow): RateDto {
  return {
    id: r.id,
    type: r.tipo as RateType,
    name: r.nombre,
    unit: r.unidad,
    unitPrice: Number(r.valorUnitario),
  }
}

/** Cálculo puro (CU-60): montos en pesos enteros, IVA sobre el subtotal. */
export function computeTotals(
  items: { rate: RateDto; quantity: number }[],
  taxRate = DEFAULT_TAX_RATE,
): EstimateTotals {
  const lines: EstimateLine[] = items.map(({ rate, quantity }) => ({
    rateId: rate.id,
    type: rate.type,
    name: rate.name,
    unit: rate.unit,
    unitPrice: rate.unitPrice,
    quantity,
    amount: Math.round(rate.unitPrice * quantity),
  }))
  const subtotal = lines.reduce((acc, l) => acc + l.amount, 0)
  const tax = Math.round((subtotal * taxRate) / 100)
  return { lines, subtotal, taxRate, tax, total: subtotal + tax }
}

interface CalcInput {
  items?: { rateId?: number; quantity?: number }[]
  taxRate?: number
}

async function buildTotals(input: CalcInput): Promise<EstimateTotals> {
  const items = Array.isArray(input.items) ? input.items : []
  if (items.length === 0) {
    throw new EstimateError(400, 'Debe ingresar al menos un material, maquinaria o recurso', 'items')
  }
  const taxRate = input.taxRate ?? DEFAULT_TAX_RATE
  if (!Number.isFinite(taxRate) || taxRate < 0 || taxRate > 100) {
    throw new EstimateError(400, 'La tasa de IVA debe estar entre 0 y 100', 'taxRate')
  }
  for (const it of items) {
    if (!Number.isInteger(it.rateId)) {
      throw new EstimateError(400, 'Cada ítem debe indicar una tarifa válida', 'items')
    }
    if (typeof it.quantity !== 'number' || !Number.isFinite(it.quantity) || it.quantity <= 0) {
      throw new EstimateError(400, 'La cantidad de cada ítem debe ser mayor a 0', 'items')
    }
  }

  const ids = [...new Set(items.map((i) => i.rateId as number))]
  const rows = await prisma.tarifaCosto.findMany({ where: { id: { in: ids } } })
  const byId = new Map(rows.map((r) => [r.id, toRateDto(r)]))
  const resolved = items.map((it) => {
    const rate = byId.get(it.rateId as number)
    if (!rate) throw new EstimateError(404, `Tarifa ${it.rateId} no encontrada`, 'items')
    // Precondición CU-60: deben existir valores definidos
    if (!(rate.unitPrice > 0)) {
      throw new EstimateError(422, `La tarifa "${rate.name}" no tiene un valor definido`, 'items')
    }
    return { rate, quantity: it.quantity as number }
  })
  return computeTotals(resolved, taxRate)
}

function toEstimateDto(row: {
  id: number
  descripcion: string
  tasaIva: unknown
  detalle: string
  fechaCreacion: Date
}): EstimateDto {
  const totals = JSON.parse(row.detalle) as EstimateTotals
  return {
    ...totals,
    taxRate: Number(row.tasaIva),
    id: row.id,
    description: row.descripcion,
    createdAt: row.fechaCreacion.toISOString(),
  }
}

export const estimateService = {
  // ---- Tarifas ----
  async listRates(): Promise<RateDto[]> {
    const rows = await prisma.tarifaCosto.findMany({ orderBy: [{ tipo: 'asc' }, { nombre: 'asc' }] })
    return rows.map(toRateDto)
  },

  async createRate(
    input: { type?: string; name?: string; unit?: string; unitPrice?: number },
    userId?: number,
  ): Promise<RateDto> {
    if (!RATE_TYPES.includes(input.type as RateType)) {
      throw new EstimateError(400, 'Tipo de tarifa inválido', 'type')
    }
    const name = (input.name ?? '').trim()
    if (!name) throw new EstimateError(400, 'El nombre es obligatorio', 'name')
    if (typeof input.unitPrice !== 'number' || !Number.isFinite(input.unitPrice) || input.unitPrice <= 0) {
      throw new EstimateError(400, 'El valor unitario debe ser mayor a 0', 'unitPrice')
    }
    const row = await prisma.tarifaCosto.create({
      data: {
        tipo: input.type as string,
        nombre: name.slice(0, 120),
        unidad: (input.unit ?? '').trim().slice(0, 30) || 'unidad',
        valorUnitario: input.unitPrice,
      },
    })
    await auditService.log({
      modulo: 'costos',
      accion: 'crear_tarifa',
      valorNuevo: toRateDto(row),
      idUsuario: userId,
    })
    return toRateDto(row)
  },

  async removeRate(id: number, userId?: number): Promise<void> {
    const row = await prisma.tarifaCosto.findUnique({ where: { id } })
    if (!row) throw new EstimateError(404, 'Tarifa no encontrada')
    await prisma.tarifaCosto.delete({ where: { id } })
    await auditService.log({
      modulo: 'costos',
      accion: 'eliminar_tarifa',
      valorAnterior: toRateDto(row),
      idUsuario: userId,
    })
  },

  // ---- CU-60 ----
  calculate(input: CalcInput): Promise<EstimateTotals> {
    return buildTotals(input)
  },

  // ---- CU-61 ----
  async create(input: CalcInput & { description?: string }, userId?: number): Promise<EstimateDto> {
    const totals = await buildTotals(input)
    const row = await prisma.estimacion.create({
      data: {
        descripcion: (input.description ?? '').trim().slice(0, 200),
        subtotal: totals.subtotal,
        tasaIva: totals.taxRate,
        iva: totals.tax,
        total: totals.total,
        detalle: JSON.stringify(totals),
        idUsuario: userId ?? null,
      },
    })
    await auditService.log({
      modulo: 'costos',
      accion: 'crear_estimacion',
      valorNuevo: { id: row.id, total: totals.total },
      idUsuario: userId,
    })
    return toEstimateDto(row)
  },

  async list(): Promise<EstimateDto[]> {
    const rows = await prisma.estimacion.findMany({ orderBy: { id: 'desc' }, take: 100 })
    return rows.map(toEstimateDto)
  },

  async get(id: number): Promise<EstimateDto> {
    const row = await prisma.estimacion.findUnique({ where: { id } })
    if (!row) throw new EstimateError(404, 'Estimación no encontrada')
    return toEstimateDto(row)
  },
}
