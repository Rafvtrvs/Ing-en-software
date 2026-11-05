import { prisma } from '../db/prisma.js'
import { auditService } from './audit.service.js'

class RescheduleError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

function toDto(row: {
  id: number
  idOt: string
  fechaAnterior: string
  fechaNueva: string
  idUsuario: string
  nombreUsuario: string
  cambiadoEn: Date
}) {
  return {
    id: String(row.id),
    orderId: row.idOt,
    previousDate: row.fechaAnterior,
    newDate: row.fechaNueva,
    changedById: row.idUsuario,
    changedByName: row.nombreUsuario,
    changedAt: row.cambiadoEn.toISOString(),
  }
}

function parseDateOnly(value: string): Date | null {
  const trimmed = value.trim().slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null
  const d = new Date(`${trimmed}T12:00:00`)
  return Number.isNaN(d.getTime()) ? null : d
}

export const rescheduleService = {
  async listByOrder(orderId: string) {
    const order = await prisma.ordenTrabajo.findUnique({ where: { id: orderId } })
    if (!order) throw new RescheduleError(404, 'Orden de trabajo no encontrada')

    const rows = await prisma.historialReprogramacionOt.findMany({
      where: { idOt: orderId },
      orderBy: { cambiadoEn: 'desc' },
    })
    return rows.map(toDto)
  },

  async create(
    orderId: string,
    input: {
      previousDate: string
      newDate: string
      changedById: string
      changedByName: string
    },
    userId?: number,
  ) {
    const order = await prisma.ordenTrabajo.findUnique({ where: { id: orderId } })
    if (!order) throw new RescheduleError(404, 'Orden de trabajo no encontrada')

    const newDate = String(input.newDate ?? '').trim().slice(0, 10)
    if (!newDate) throw new RescheduleError(400, 'La nueva fecha es obligatoria')

    const parsed = parseDateOnly(newDate)
    if (!parsed) {
      throw new RescheduleError(400, 'Formato de fecha inválido (use YYYY-MM-DD)')
    }

    const previousDate = String(input.previousDate ?? '').trim().slice(0, 40) || '—'

    const result = await prisma.$transaction(async (tx) => {
      const row = await tx.historialReprogramacionOt.create({
        data: {
          idOt: orderId,
          fechaAnterior: previousDate.slice(0, 40),
          fechaNueva: newDate,
          idUsuario: (input.changedById || 'sistema').slice(0, 80),
          nombreUsuario: (input.changedByName || 'Sistema').slice(0, 150),
        },
      })

      await tx.ordenTrabajo.update({
        where: { id: orderId },
        data: { fechaLimite: parsed },
      })

      return row
    })

    await auditService.log({
      modulo: 'ordenes',
      accion: 'reprogramar',
      valorAnterior: { orderId, fecha: previousDate },
      valorNuevo: { orderId, fecha: newDate },
      idUsuario: userId,
    })

    return toDto(result)
  },
}
