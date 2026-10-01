import { describe, it, expect, beforeEach, vi } from 'vitest'
import { computeDelay, delayService, levelForDays, sortByUrgency } from './services/delay.service'
import { orderHistoryService } from './services/orderHistory.service'
import { orderService } from './services/order.service'
import { prisma } from './db/prisma'
import { auditService } from './services/audit.service'
import { pushService } from './external/push.service'

const NOW = new Date('2026-06-20T12:00:00Z')
const day = (n: number) => new Date(NOW.getTime() - n * 86400000)

function order(id: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    estado: 'En Curso',
    prioridad: 'Media',
    direccion: 'Calle 1',
    fechaEmision: day(30),
    fechaLimite: null,
    cliente: { nombre: 'Cliente' },
    ...overrides,
  }
}

describe('Retrasos - RF28 (CU-93 a CU-96)', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(NOW)
    // @ts-ignore
    auditService.log = vi.fn().mockResolvedValue(undefined)
    pushService.notify = vi.fn().mockResolvedValue({ id: 'p' })
  })

  it('CU-93: clasifica por días de atraso', () => {
    expect(levelForDays(0)).toBeNull()
    expect(levelForDays(1)).toBe('Bajo')
    expect(levelForDays(3)).toBe('Bajo')
    expect(levelForDays(4)).toBe('Medio')
    expect(levelForDays(8)).toBe('Alto')
  })

  it('usa la fecha límite si existe y 7 días desde la emisión si no', () => {
    const withDue = computeDelay(order('A', { fechaLimite: day(5) }) as any, NOW)
    expect(withDue).toMatchObject({ daysLate: 5, level: 'Medio' })
    const noDue = computeDelay(order('B', { fechaEmision: day(10) }) as any, NOW)
    expect(noDue).toMatchObject({ daysLate: 3, level: 'Bajo' })
  })

  it('ignora órdenes finalizadas o dentro de plazo', () => {
    expect(computeDelay(order('C', { estado: 'Completada' }) as any, NOW)).toBeNull()
    expect(computeDelay(order('D', { fechaLimite: new Date(NOW.getTime() + 86400000) }) as any, NOW)).toBeNull()
  })

  it('CU-94: prioriza Alto primero y luego mayor atraso', async () => {
    // @ts-ignore
    prisma.ordenTrabajo.findMany = vi.fn().mockResolvedValue([
      order('bajo', { fechaLimite: day(2) }),
      order('alto1', { fechaLimite: day(9) }),
      order('alto2', { fechaLimite: day(20) }),
      order('medio', { fechaLimite: day(5) }),
    ])
    const { orders, summary } = await delayService.list()
    expect(orders.map((o) => o.id)).toEqual(['alto2', 'alto1', 'medio', 'bajo'])
    expect(summary).toEqual({ Alto: 2, Medio: 1, Bajo: 1 })
    expect((await delayService.list('Medio')).orders).toHaveLength(1)
    await expect(delayService.list('Extremo')).rejects.toMatchObject({ status: 400 })
    expect(sortByUrgency([])).toEqual([])
  })

  it('CU-95: notifica solo retrasos Alto no notificados en 24 h', async () => {
    // @ts-ignore
    prisma.ordenTrabajo.findMany = vi.fn().mockResolvedValue([
      order('OT-A', { fechaLimite: day(10) }),
      order('OT-B', { fechaLimite: day(12) }),
      order('OT-C', { fechaLimite: day(2) }),
    ])
    // @ts-ignore
    prisma.bitacoraAuditoria.findMany = vi
      .fn()
      .mockResolvedValue([{ valorNuevo: JSON.stringify({ orderId: 'OT-B' }) }])
    const notified = await delayService.notifyHighDelays(1)
    expect(notified.map((n) => n.id)).toEqual(['OT-A'])
    expect(pushService.notify).toHaveBeenCalledTimes(1)
  })

  it('CU-96: reprograma con nueva fecha futura; rechaza pasadas', async () => {
    // @ts-ignore
    prisma.ordenTrabajo.findUnique = vi.fn().mockResolvedValue(order('OT-1', { fechaLimite: day(10) }))
    // @ts-ignore
    prisma.ordenTrabajo.update = vi.fn().mockResolvedValue({ ...order('OT-1'), fechaEmision: day(30) })
    await delayService.manage('OT-1', { action: 'reprogramar', newDueDate: '2026-07-01' }, 1)
    expect(prisma.ordenTrabajo.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { fechaLimite: new Date('2026-07-01T00:00:00Z') } }),
    )
    await expect(
      delayService.manage('OT-1', { action: 'reprogramar', newDueDate: '2026-06-01' }),
    ).rejects.toMatchObject({ status: 400, field: 'newDueDate' })
    await expect(delayService.manage('OT-1', { action: 'borrar' })).rejects.toMatchObject({ status: 400 })
  })

  it('CU-96: priorizar marca Urgente; intervenir pasa a En Curso y registra cambio de estado', async () => {
    // @ts-ignore
    prisma.ordenTrabajo.findUnique = vi
      .fn()
      .mockResolvedValue(order('OT-1', { estado: 'Pendiente', fechaLimite: day(10) }))
    // @ts-ignore
    prisma.ordenTrabajo.update = vi.fn().mockResolvedValue(order('OT-1'))
    await delayService.manage('OT-1', { action: 'priorizar' }, 1)
    expect(prisma.ordenTrabajo.update).toHaveBeenLastCalledWith(
      expect.objectContaining({ data: { prioridad: 'Urgente' } }),
    )
    await delayService.manage('OT-1', { action: 'intervenir' }, 1)
    expect(auditService.log).toHaveBeenCalledWith(expect.objectContaining({ accion: 'cambio_estado' }))
  })

  it('CU-96: 409 si la orden no está retrasada, 404 si no existe', async () => {
    // @ts-ignore
    prisma.ordenTrabajo.findUnique = vi
      .fn()
      .mockResolvedValueOnce(order('OT-1', { fechaLimite: new Date(NOW.getTime() + 86400000) }))
      .mockResolvedValueOnce(null)
    await expect(delayService.manage('OT-1', { action: 'priorizar' })).rejects.toMatchObject({ status: 409 })
    await expect(delayService.manage('X', { action: 'priorizar' })).rejects.toMatchObject({ status: 404 })
  })
})

describe('Cambios de estado - RF29 (CU-97 a CU-99)', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.useRealTimers()
    // @ts-ignore
    auditService.log = vi.fn().mockResolvedValue(undefined)
    pushService.notify = vi.fn().mockResolvedValue({ id: 'p' })
  })

  it('CU-97/98: al cambiar el estado registra en bitácora y notifica', async () => {
    // @ts-ignore
    prisma.ordenTrabajo.findUnique = vi.fn().mockResolvedValue({ id: 'OT-1', estado: 'Pendiente' })
    // @ts-ignore
    prisma.ordenTrabajo.update = vi.fn().mockResolvedValue({ id: 'OT-1', estado: 'En Curso' })
    await orderService.update('OT-1', { status: 'En Curso' as any }, 4)
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        accion: 'cambio_estado',
        valorAnterior: { orderId: 'OT-1', estado: 'Pendiente' },
        valorNuevo: { orderId: 'OT-1', estado: 'En Curso' },
        idUsuario: 4,
      }),
    )
    expect(pushService.notify).toHaveBeenCalledOnce()
  })

  it('CU-97: sin cambio de estado no registra ni notifica', async () => {
    // @ts-ignore
    prisma.ordenTrabajo.findUnique = vi.fn().mockResolvedValue({ id: 'OT-1', estado: 'Pendiente' })
    // @ts-ignore
    prisma.ordenTrabajo.update = vi.fn().mockResolvedValue({ id: 'OT-1', estado: 'Pendiente' })
    await orderService.update('OT-1', { priority: 'Alta' as any }, 4)
    expect(auditService.log).not.toHaveBeenCalledWith(expect.objectContaining({ accion: 'cambio_estado' }))
    expect(pushService.notify).not.toHaveBeenCalled()
  })

  it('CU-99: historial con fecha, hora y autor', async () => {
    // @ts-ignore
    prisma.bitacoraAuditoria.findMany = vi.fn().mockResolvedValue([
      {
        id: BigInt(9),
        valorAnterior: JSON.stringify({ orderId: 'OT-1', estado: 'Pendiente' }),
        valorNuevo: JSON.stringify({ orderId: 'OT-1', estado: 'En Curso' }),
        fechaHora: new Date('2026-06-20T15:30:00Z'),
        usuario: { nombre: 'Admin' },
      },
    ])
    const list = await orderHistoryService.list({ orderId: 'OT-1' })
    expect(list[0]).toEqual({
      id: '9',
      orderId: 'OT-1',
      from: 'Pendiente',
      to: 'En Curso',
      user: 'Admin',
      at: '2026-06-20T15:30:00.000Z',
    })
    expect(prisma.bitacoraAuditoria.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ valorNuevo: { contains: '"orderId":"OT-1"' } }),
      }),
    )
  })
})
