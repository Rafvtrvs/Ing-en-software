import { describe, it, expect, beforeEach, vi } from 'vitest'
import { orderService } from './services/order.service'
import { prisma } from './db/prisma'
import { auditService } from './services/audit.service'

describe('OrderService - coordenadas', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    // Evitar llamadas reales a la auditoría / BD
    // @ts-ignore
    auditService.log = vi.fn().mockResolvedValue(undefined)
  })

  it('actualiza latitud y longitud correctamente', async () => {
    const id = 'OT-2026-9999'
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
      latitud: -33.45,
      longitud: -70.65,
    }

    // Mocks prisma
    // @ts-ignore
    prisma.ordenTrabajo.findUnique = vi.fn().mockResolvedValue(before)
    // @ts-ignore
    prisma.ordenTrabajo.update = vi.fn().mockResolvedValue(after)

    const result = await orderService.update(id, { latitude: after.latitud, longitude: after.longitud }, 1)

    expect(prisma.ordenTrabajo.update).toHaveBeenCalled()
    expect(result.latitude).toBe(after.latitud)
    expect(result.longitude).toBe(after.longitud)
  })

  it('rechaza coordenadas inválidas', async () => {
    await expect(orderService.update('OT-1', { latitude: 123 }, 1)).rejects.toThrow(/Invalid coordinates/)
  })
})