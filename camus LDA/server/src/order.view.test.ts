import { describe, it, expect, beforeEach, vi } from 'vitest'
import { orderService } from './services/order.service'
import { prisma } from './db/prisma'

describe('OrderService - visualizar ubicación', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('devuelve la orden con dirección y coordenadas', async () => {
    const id = 'OT-100'
    const row = {
      id,
      direccion: 'Calle 1',
      latitud: -33.5,
      longitud: -70.6,
      servicio: 'S',
      categoria: 'C',
      estado: 'Pendiente',
      prioridad: 'Media',
      progreso: 0,
      ordenVisual: 1,
      cliente: { id: 1, nombre: 'Cliente' },
      operador: { id: 2, nombre: 'Operador' },
    }
    // @ts-ignore
    prisma.ordenTrabajo.findUnique = vi.fn().mockResolvedValue(row)

    const res = await orderService.get(id)
    expect(prisma.ordenTrabajo.findUnique).toHaveBeenCalledWith({ where: { id }, include: { cliente: true, operador: true } })
    expect(res.address).toBe(row.direccion)
    expect(res.latitude).toBe(row.latitud)
    expect(res.longitude).toBe(row.longitud)
  })

  it('lanza 404 si no existe', async () => {
    const id = 'NO-EXISTE'
    // @ts-ignore
    prisma.ordenTrabajo.findUnique = vi.fn().mockResolvedValue(null)
    await expect(orderService.get(id)).rejects.toMatchObject({ status: 404 })
  })
})