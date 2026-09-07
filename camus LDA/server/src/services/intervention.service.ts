// ============================================================
//  InterventionService — intervenciones por OT (CU-149–151)
// ============================================================
import { prisma } from '../db/prisma.js'
import { auditService } from './audit.service.js'

export class InterventionError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'InterventionError'
    this.status = status
  }
}

export interface InterventionDto {
  id: number
  orderId: string
  detail: string
}

function toDto(row: { id: number; detalle: string | null; idOt: string | null }): InterventionDto {
  return {
    id: row.id,
    orderId: row.idOt ?? '',
    detail: row.detalle ?? '',
  }
}

export const interventionService = {
  async listByOrder(orderId: string): Promise<InterventionDto[]> {
    const order = await prisma.ordenTrabajo.findUnique({ where: { id: orderId } })
    if (!order) {
      throw new InterventionError(404, 'Orden de trabajo no encontrada')
    }

    const rows = await prisma.intervencion.findMany({
      where: { idOt: orderId },
      orderBy: { id: 'desc' },
    })
    return rows.map(toDto)
  },

  async create(orderId: string, detail: string, userId?: number): Promise<InterventionDto> {
    const trimmed = detail?.trim() ?? ''
    if (!trimmed) {
      throw new InterventionError(400, 'La descripción de la intervención es obligatoria')
    }
    if (trimmed.length > 255) {
      throw new InterventionError(400, 'La descripción no puede superar 255 caracteres')
    }

    const order = await prisma.ordenTrabajo.findUnique({ where: { id: orderId } })
    if (!order) {
      throw new InterventionError(404, 'Orden de trabajo no encontrada')
    }

    const row = await prisma.intervencion.create({
      data: {
        detalle: trimmed,
        idOt: orderId,
      },
    })

    await auditService.log({
      modulo: 'intervenciones',
      accion: 'crear',
      valorNuevo: row,
      idUsuario: userId,
    })

    return toDto(row)
  },

  async update(
    orderId: string,
    interventionId: number,
    detail: string,
    userId?: number,
  ): Promise<InterventionDto> {
    const trimmed = detail?.trim() ?? ''
    if (!trimmed) {
      throw new InterventionError(400, 'La descripción de la intervención es obligatoria')
    }
    if (trimmed.length > 255) {
      throw new InterventionError(400, 'La descripción no puede superar 255 caracteres')
    }

    const existing = await prisma.intervencion.findUnique({
      where: { id: interventionId },
    })
    if (!existing || existing.idOt !== orderId) {
      throw new InterventionError(404, 'Intervención no encontrada en esta orden')
    }

    const row = await prisma.intervencion.update({
      where: { id: interventionId },
      data: { detalle: trimmed },
    })

    await auditService.log({
      modulo: 'intervenciones',
      accion: 'actualizar',
      valorAnterior: existing,
      valorNuevo: row,
      idUsuario: userId,
    })

    return toDto(row)
  },
}
