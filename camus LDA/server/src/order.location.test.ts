import { describe, it, expect, beforeEach, vi } from 'vitest'
import { orderService } from './services/order.service'
import { prisma } from './db/prisma'
import { auditService } from './services/audit.service'

describe('OrderService - registrar ubicación', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    // Evitar que auditService intente usar Prisma/DB durante tests unitarios
    // @ts-ignore
    auditService.log = vi.fn().mockResolvedValue(undefined)
  })

  it('debe actualizar la dirección de una orden existente', async () => {
    const id = 'OT-2026-1234'
    const before = {
      id,
      direccion: 'Old address',
      servicio: 'Servicio X',
      categoria: 'Cat',
      estado: 'Pendiente',
      prioridad: 'Media',
      progreso: 0,
      ordenVisual: 1,
    }
    const after = {
      ...before,
      direccion: 'Av. Siempre Viva 742',
    }

    // Mock prisma calls used in orderService.update
    // findUnique para valor anterior
    // update para escribir
    // Ambos métodos existen en la instancia prisma.ordenTrabajo
    // @ts-ignore - reasignamos mocks sobre el cliente prisma real
    prisma.ordenTrabajo.findUnique = vi.fn().mockResolvedValue(before)
    // @ts-ignore
    prisma.ordenTrabajo.update = vi.fn().mockResolvedValue(after)

    const result = await orderService.update(id, { address: after.direccion }, 1)

    expect(prisma.ordenTrabajo.findUnique).toHaveBeenCalledWith({ where: { id } })
    expect(prisma.ordenTrabajo.update).toHaveBeenCalled()
    expect(result.address).toBe(after.direccion)
  })
})