// ============================================================
//  InterventionService — intervenciones por OT (CU-149–151)
// ============================================================
import { prisma } from '../db/prisma.js'
import { mailOpsRecipient, mailService } from '../external/mail.service.js'
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

    const order = await prisma.ordenTrabajo.findUnique({
      where: { id: orderId },
      include: { cliente: true, operador: true },
    })
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
      valorNuevo: {
        orderId,
        idOt: orderId,
        interventionId: row.id,
        detail: row.detalle,
      },
      idUsuario: userId,
    })

    const solicitante =
      userId != null
        ? await prisma.usuario.findUnique({ where: { id: userId }, select: { nombre: true } })
        : null
    const clienteNombre =
      order.cliente?.nombre?.trim() ||
      order.nombreCliente?.trim() ||
      order.cliente?.empresa?.trim() ||
      'Cliente'
    const who = solicitante?.nombre?.trim() || order.operador?.nombre?.trim() || '—'

    void mailService
      .send({
        to: mailOpsRecipient(),
        subject: `Camus LDA · Intervención ${orderId}`,
        body: `Se registró una solicitud de intervención.\n\nOrden: ${orderId}\nCliente: ${clienteNombre}\nServicio: ${order.servicio?.trim() || '—'}\nSolicitante: ${who}\nDetalle: ${trimmed}`,
      })
      .catch((err) => console.error('[intervention] mail create', err))

    const { notifyAdmins } = await import('./pushNotify.service.js')
    void notifyAdmins({
      title: `Intervención · OT ${orderId}`,
      body: `${who}: ${trimmed}`,
      link: `/ordenes?order=${encodeURIComponent(orderId)}`,
      orderId,
      notifType: 'order',
      excludeUserId: userId,
    }).catch((err) => console.error('[intervention] push create', err))

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
      valorAnterior: {
        orderId,
        idOt: orderId,
        interventionId: existing.id,
        detail: existing.detalle,
      },
      valorNuevo: {
        orderId,
        idOt: orderId,
        interventionId: row.id,
        detail: row.detalle,
      },
      idUsuario: userId,
    })

    return toDto(row)
  },
}
