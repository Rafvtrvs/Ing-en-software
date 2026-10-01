import { describe, it, expect, beforeEach, vi } from 'vitest'
import { orderService } from './services/order.service'
import { prisma } from './db/prisma'
import { auditService } from './services/audit.service'
import { mailService } from './external/mail.service'
import { pushService } from './external/push.service'

describe('OrderService - validación de ubicación', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    // Evitar llamadas reales a servicios externos / auditoría
    // @ts-ignore
    auditService.log = vi.fn().mockResolvedValue(undefined)
    // @ts-ignore
    mailService.send = vi.fn().mockResolvedValue({ id: 'm' })
    // @ts-ignore
    pushService.notify = vi.fn().mockResolvedValue({ id: 'p' })
  })

  it('rechaza crear si no hay dirección ni coordenadas', async () => {
    // @ts-ignore
    prisma.ordenTrabajo.create = vi.fn()
    await expect(orderService.create({}, 1)).rejects.toMatchObject({ status: 400 })
    expect(prisma.ordenTrabajo.create).not.toHaveBeenCalled()
  })

  it('acepta crear con dirección válida', async () => {
    const created = { id: 'OT-1', direccion: 'Calle Falsa 123' }
    // @ts-ignore
    prisma.ordenTrabajo.create = vi.fn().mockResolvedValue(created)
    const res = await orderService.create({ address: created.direccion }, 1)
    expect(res.address).toBe(created.direccion)
  })

  it('rechaza actualizar si quita dirección y no provee coords', async () => {
    const id = 'OT-2'
    // findUnique devuelve antes existente
    // @ts-ignore
    prisma.ordenTrabajo.findUnique = vi.fn().mockResolvedValue({ id, direccion: 'Old' })
    // @ts-ignore
    prisma.ordenTrabajo.update = vi.fn()

    await expect(orderService.update(id, { address: '' }, 1)).rejects.toMatchObject({ status: 400 })
    expect(prisma.ordenTrabajo.update).not.toHaveBeenCalled()
  })
})