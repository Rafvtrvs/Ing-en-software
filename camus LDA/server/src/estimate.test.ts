import { describe, it, expect, beforeEach, vi } from 'vitest'
import { computeTotals, estimateService } from './services/estimate.service'
import { prisma } from './db/prisma'
import { auditService } from './services/audit.service'

const rates = [
  { id: 1, tipo: 'insumo', nombre: 'Tubería PVC 110mm', unidad: 'm', valorUnitario: 4500 },
  { id: 2, tipo: 'maquinaria', nombre: 'Camión hidrojet', unidad: 'h', valorUnitario: 35000 },
  { id: 3, tipo: 'combustible', nombre: 'Diésel', unidad: 'l', valorUnitario: 1100 },
  { id: 4, tipo: 'personal', nombre: 'Operario', unidad: 'h', valorUnitario: 0 },
]

describe('EstimateService - RF16 (CU-60 y CU-61)', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    // @ts-ignore
    auditService.log = vi.fn().mockResolvedValue(undefined)
    // @ts-ignore
    prisma.tarifaCosto.findMany = vi.fn().mockImplementation(async ({ where }) =>
      rates.filter((r) => where.id.in.includes(r.id)),
    )
  })

  it('CU-60: calcula subtotal, IVA 19% y total', async () => {
    const res = await estimateService.calculate({
      items: [
        { rateId: 1, quantity: 10 }, // 45.000
        { rateId: 2, quantity: 2 }, // 70.000
        { rateId: 3, quantity: 20 }, // 22.000
      ],
    })
    expect(res.subtotal).toBe(137000)
    expect(res.tax).toBe(26030)
    expect(res.total).toBe(163030)
    expect(res.lines).toHaveLength(3)
  })

  it('computeTotals redondea a pesos enteros y respeta la tasa indicada', () => {
    const res = computeTotals(
      [{ rate: { id: 1, type: 'insumo', name: 'x', unit: 'u', unitPrice: 333.33 }, quantity: 3 }],
      10,
    )
    expect(res.subtotal).toBe(1000)
    expect(res.tax).toBe(100)
    expect(res.total).toBe(1100)
  })

  it('CU-60: exige al menos un ítem y cantidades positivas', async () => {
    await expect(estimateService.calculate({ items: [] })).rejects.toMatchObject({ status: 400 })
    await expect(
      estimateService.calculate({ items: [{ rateId: 1, quantity: 0 }] }),
    ).rejects.toMatchObject({ status: 400 })
  })

  it('CU-60: falla si la tarifa no existe o no tiene valor definido', async () => {
    await expect(
      estimateService.calculate({ items: [{ rateId: 99, quantity: 1 }] }),
    ).rejects.toMatchObject({ status: 404 })
    await expect(
      estimateService.calculate({ items: [{ rateId: 4, quantity: 1 }] }),
    ).rejects.toMatchObject({ status: 422 })
  })

  it('CU-60: valida la tasa de IVA', async () => {
    await expect(
      estimateService.calculate({ items: [{ rateId: 1, quantity: 1 }], taxRate: 150 }),
    ).rejects.toMatchObject({ status: 400, field: 'taxRate' })
  })

  it('CU-61: guarda la estimación y la devuelve con su detalle', async () => {
    // @ts-ignore
    prisma.estimacion.create = vi.fn().mockImplementation(async ({ data }) => ({
      id: 5,
      fechaCreacion: new Date('2026-05-01T10:00:00Z'),
      ...data,
    }))
    const dto = await estimateService.create(
      { description: 'Destape cliente XYZ', items: [{ rateId: 1, quantity: 2 }] },
      3,
    )
    expect(dto).toMatchObject({ id: 5, description: 'Destape cliente XYZ', subtotal: 9000, total: 10710 })
    expect(dto.lines).toHaveLength(1)
    expect(auditService.log).toHaveBeenCalled()
  })

  it('CU-61: 404 si la estimación no existe', async () => {
    // @ts-ignore
    prisma.estimacion.findUnique = vi.fn().mockResolvedValue(null)
    await expect(estimateService.get(1)).rejects.toMatchObject({ status: 404 })
  })
})
