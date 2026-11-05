import { prisma } from '../db/prisma.js'
import { auditService } from './audit.service.js'

export class ModificationError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ModificationError'
    this.status = status
  }
}

function toRequestDto(row: {
  id: number
  idOt: string
  idOperador: string
  nombreOperador: string
  camposModificar: string
  motivo: string
  estado: string
  solicitadoEn: Date
  idRevisor: string | null
  nombreRevisor: string | null
  revisadoEn: Date | null
  motivoRechazo: string | null
}) {
  return {
    id: String(row.id),
    orderId: row.idOt,
    operatorId: row.idOperador,
    operatorName: row.nombreOperador,
    fieldsToModify: row.camposModificar,
    reason: row.motivo,
    status: row.estado as 'Pendiente' | 'Aprobada' | 'Rechazada',
    requestedAt: row.solicitadoEn.toISOString(),
    reviewedById: row.idRevisor ?? undefined,
    reviewedByName: row.nombreRevisor ?? undefined,
    reviewedAt: row.revisadoEn?.toISOString(),
    rejectionReason: row.motivoRechazo ?? undefined,
  }
}

function toHistoryDto(row: {
  id: number
  idOt: string
  campo: string
  etiqueta: string
  valorAnterior: string
  valorNuevo: string
  idUsuario: string
  nombreUsuario: string
  cambiadoEn: Date
}) {
  return {
    id: String(row.id),
    orderId: row.idOt,
    field: row.campo,
    fieldLabel: row.etiqueta,
    previousValue: row.valorAnterior,
    newValue: row.valorNuevo,
    changedById: row.idUsuario,
    changedByName: row.nombreUsuario,
    changedAt: row.cambiadoEn.toISOString(),
  }
}

export const modificationService = {
  async listRequests() {
    const rows = await prisma.solicitudModificacion.findMany({
      orderBy: { solicitadoEn: 'desc' },
    })
    return rows.map(toRequestDto)
  },

  async createRequest(
    orderId: string,
    input: {
      fieldsToModify: string
      reason: string
      operatorId: string
      operatorName: string
    },
    userId?: number,
  ) {
    const fields = input.fieldsToModify?.trim() ?? ''
    const reason = input.reason?.trim() ?? ''
    if (!fields || !reason) {
      throw new ModificationError(400, 'Complete campos y motivo de la solicitud')
    }

    const order = await prisma.ordenTrabajo.findUnique({ where: { id: orderId } })
    if (!order) throw new ModificationError(404, 'Orden de trabajo no encontrada')

    const row = await prisma.solicitudModificacion.create({
      data: {
        idOt: orderId,
        idOperador: input.operatorId || 'operador',
        nombreOperador: input.operatorName || 'Operador',
        camposModificar: fields.slice(0, 255),
        motivo: reason.slice(0, 500),
        estado: 'Pendiente',
      },
    })

    await auditService.log({
      modulo: 'ordenes',
      accion: 'solicitud-modificacion',
      valorNuevo: row,
      idUsuario: userId,
    })

    return toRequestDto(row)
  },

  async approve(
    requestId: number,
    reviewer: { id: string; name: string },
    userId?: number,
  ) {
    const before = await prisma.solicitudModificacion.findUnique({
      where: { id: requestId },
    })
    if (!before) throw new ModificationError(404, 'Solicitud no encontrada')
    if (before.estado !== 'Pendiente') {
      throw new ModificationError(409, 'La solicitud ya fue revisada')
    }

    const row = await prisma.solicitudModificacion.update({
      where: { id: requestId },
      data: {
        estado: 'Aprobada',
        idRevisor: reviewer.id,
        nombreRevisor: reviewer.name,
        revisadoEn: new Date(),
        motivoRechazo: null,
      },
    })

    await auditService.log({
      modulo: 'ordenes',
      accion: 'aprobar-modificacion',
      valorAnterior: before,
      valorNuevo: row,
      idUsuario: userId,
    })

    return toRequestDto(row)
  },

  async reject(
    requestId: number,
    reason: string,
    reviewer: { id: string; name: string },
    userId?: number,
  ) {
    const trimmed = reason?.trim() ?? ''
    if (!trimmed) {
      throw new ModificationError(400, 'Indique el motivo del rechazo')
    }

    const before = await prisma.solicitudModificacion.findUnique({
      where: { id: requestId },
    })
    if (!before) throw new ModificationError(404, 'Solicitud no encontrada')
    if (before.estado !== 'Pendiente') {
      throw new ModificationError(409, 'La solicitud ya fue revisada')
    }

    const row = await prisma.solicitudModificacion.update({
      where: { id: requestId },
      data: {
        estado: 'Rechazada',
        motivoRechazo: trimmed.slice(0, 500),
        idRevisor: reviewer.id,
        nombreRevisor: reviewer.name,
        revisadoEn: new Date(),
      },
    })

    await auditService.log({
      modulo: 'ordenes',
      accion: 'rechazar-modificacion',
      valorAnterior: before,
      valorNuevo: row,
      idUsuario: userId,
    })

    return toRequestDto(row)
  },

  async listHistory(orderId: string) {
    const order = await prisma.ordenTrabajo.findUnique({ where: { id: orderId } })
    if (!order) throw new ModificationError(404, 'Orden de trabajo no encontrada')

    const rows = await prisma.historialModificacionOt.findMany({
      where: { idOt: orderId },
      orderBy: { cambiadoEn: 'desc' },
    })
    return rows.map(toHistoryDto)
  },

  async addHistory(
    orderId: string,
    entry: {
      field: string
      fieldLabel: string
      previousValue: string
      newValue: string
      changedById: string
      changedByName: string
    },
    userId?: number,
  ) {
    const order = await prisma.ordenTrabajo.findUnique({ where: { id: orderId } })
    if (!order) throw new ModificationError(404, 'Orden de trabajo no encontrada')

    const row = await prisma.historialModificacionOt.create({
      data: {
        idOt: orderId,
        campo: entry.field.slice(0, 80),
        etiqueta: entry.fieldLabel.slice(0, 120),
        valorAnterior: String(entry.previousValue ?? '').slice(0, 500),
        valorNuevo: String(entry.newValue ?? '').slice(0, 500),
        idUsuario: entry.changedById || 'sistema',
        nombreUsuario: entry.changedByName || 'Sistema',
      },
    })

    await auditService.log({
      modulo: 'ordenes',
      accion: 'historial-modificacion',
      valorNuevo: row,
      idUsuario: userId,
    })

    return toHistoryDto(row)
  },
}
