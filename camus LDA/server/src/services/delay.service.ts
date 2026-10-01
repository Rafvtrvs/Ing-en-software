// ============================================================
//  DelayService — órdenes retrasadas (RF28 / CU-93 a CU-96)
//  CU-93/94: detecta y clasifica retrasos (Bajo / Medio / Alto) y prioriza.
//  CU-95: notifica los retrasos de nivel Alto.
//  CU-96: gestiona una orden retrasada (reprogramar, priorizar, intervenir).
// ============================================================
import { prisma } from '../db/prisma.js'
import { mailService } from '../external/mail.service.js'
import { pushService } from '../external/push.service.js'
import { auditService } from './audit.service.js'
import { toOrderDto } from './mappers.js'

export class DelayError extends Error {
  status: number
  field?: string

  constructor(status: number, message: string, field?: string) {
    super(message)
    this.name = 'DelayError'
    this.status = status
    this.field = field
  }
}

export type DelayLevel = 'Bajo' | 'Medio' | 'Alto'
export type DelayAction = 'reprogramar' | 'priorizar' | 'intervenir'

export const DELAY_LEVELS: DelayLevel[] = ['Bajo', 'Medio', 'Alto']
const LEVEL_RANK: Record<DelayLevel, number> = { Alto: 0, Medio: 1, Bajo: 2 }
/** Sin fecha límite, una OT activa se considera vencida a los 7 días de emitida */
export const DEFAULT_DEADLINE_DAYS = 7
/** Alto desde 8 días de atraso; Medio desde 4; Bajo desde 1 */
export const HIGH_DELAY_DAYS = 8
export const MEDIUM_DELAY_DAYS = 4
const ACTIVE_STATUSES = ['Pendiente', 'En Curso']
const NOTIFY_DEDUPE_HOURS = 24
const DAY_MS = 24 * 60 * 60 * 1000

export interface DelayedOrderDto {
  id: string
  client: string
  address: string
  status: string
  priority: string
  dueDate: string
  daysLate: number
  level: DelayLevel
}

interface OrderRow {
  id: string
  estado: string
  prioridad: string
  direccion: string
  fechaEmision: Date
  fechaLimite: Date | null
  cliente?: { nombre: string } | null
}

export function levelForDays(daysLate: number): DelayLevel | null {
  if (daysLate <= 0) return null
  if (daysLate >= HIGH_DELAY_DAYS) return 'Alto'
  if (daysLate >= MEDIUM_DELAY_DAYS) return 'Medio'
  return 'Bajo'
}

function startOfDay(d: Date) {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
}

/** Cálculo puro de retraso de una orden (null si no está retrasada). */
export function computeDelay(order: OrderRow, now = new Date()): DelayedOrderDto | null {
  if (!ACTIVE_STATUSES.includes(order.estado)) return null
  const due = order.fechaLimite ?? new Date(order.fechaEmision.getTime() + DEFAULT_DEADLINE_DAYS * DAY_MS)
  const daysLate = Math.floor((startOfDay(now) - startOfDay(due)) / DAY_MS)
  const level = levelForDays(daysLate)
  if (!level) return null
  return {
    id: order.id,
    client: order.cliente?.nombre ?? '',
    address: order.direccion,
    status: order.estado,
    priority: order.prioridad,
    dueDate: due.toISOString().slice(0, 10),
    daysLate,
    level,
  }
}

/** CU-94: Alto primero; dentro del nivel, mayor atraso primero. */
export function sortByUrgency(list: DelayedOrderDto[]): DelayedOrderDto[] {
  return [...list].sort(
    (a, b) => LEVEL_RANK[a.level] - LEVEL_RANK[b.level] || b.daysLate - a.daysLate,
  )
}

async function loadDelayed(now = new Date()): Promise<DelayedOrderDto[]> {
  const rows = await prisma.ordenTrabajo.findMany({
    where: { estado: { in: ACTIVE_STATUSES } },
    include: { cliente: true },
  })
  return sortByUrgency(
    rows.map((r) => computeDelay(r, now)).filter((d): d is DelayedOrderDto => d !== null),
  )
}

export const delayService = {
  /** CU-93 y CU-94: lista clasificada y priorizada, con filtro opcional por nivel. */
  async list(level?: string) {
    if (level && !DELAY_LEVELS.includes(level as DelayLevel)) {
      throw new DelayError(400, 'Nivel de retraso inválido', 'level')
    }
    const all = await loadDelayed()
    const summary = {
      Alto: all.filter((d) => d.level === 'Alto').length,
      Medio: all.filter((d) => d.level === 'Medio').length,
      Bajo: all.filter((d) => d.level === 'Bajo').length,
    }
    return { summary, orders: level ? all.filter((d) => d.level === level) : all }
  },

  /** CU-95: alerta (push + correo) por cada retraso Alto no notificado en las últimas 24 h. */
  async notifyHighDelays(userId?: number): Promise<DelayedOrderDto[]> {
    const high = (await loadDelayed()).filter((d) => d.level === 'Alto')
    if (high.length === 0) return []

    const since = new Date(Date.now() - NOTIFY_DEDUPE_HOURS * 60 * 60 * 1000)
    const recent = await prisma.bitacoraAuditoria.findMany({
      where: { moduloAfectado: 'ordenes', accion: 'notificar_retraso', fechaHora: { gte: since } },
    })
    const alreadyNotified = new Set<string>()
    for (const r of recent) {
      try {
        alreadyNotified.add(String(JSON.parse(r.valorNuevo ?? '{}').orderId))
      } catch {
        /* registro con formato inesperado */
      }
    }

    const pending = high.filter((d) => !alreadyNotified.has(d.id))
    for (const d of pending) {
      await pushService.notify({
        token: 'admin',
        title: 'Orden con alto retraso',
        body: `${d.id} lleva ${d.daysLate} días de retraso`,
      })
      await mailService.send({
        to: 'operaciones@camus.cl',
        subject: `Alto retraso en orden ${d.id}`,
        body: `La orden ${d.id} (${d.client}) tiene ${d.daysLate} días de retraso. Estado: ${d.status}.`,
      })
      await auditService.log({
        modulo: 'ordenes',
        accion: 'notificar_retraso',
        valorNuevo: { orderId: d.id, daysLate: d.daysLate },
        idUsuario: userId,
      })
    }
    return pending
  },

  /** CU-96: reprogramar, priorizar o intervenir una orden retrasada. */
  async manage(
    orderId: string,
    input: { action?: string; newDueDate?: string },
    userId?: number,
  ) {
    const action = input.action as DelayAction
    if (!['reprogramar', 'priorizar', 'intervenir'].includes(action)) {
      throw new DelayError(400, 'Acción inválida. Use reprogramar, priorizar o intervenir', 'action')
    }
    const order = await prisma.ordenTrabajo.findUnique({
      where: { id: orderId },
      include: { cliente: true },
    })
    if (!order) throw new DelayError(404, 'Orden de trabajo no encontrada')
    if (!computeDelay(order)) throw new DelayError(409, 'La orden no está retrasada')

    const data: { fechaLimite?: Date; prioridad?: string; estado?: string } = {}
    if (action === 'reprogramar') {
      const date = input.newDueDate ? new Date(`${input.newDueDate}T00:00:00Z`) : null
      if (!date || Number.isNaN(date.getTime())) {
        throw new DelayError(400, 'Indique una nueva fecha válida (AAAA-MM-DD)', 'newDueDate')
      }
      if (startOfDay(date) < startOfDay(new Date())) {
        throw new DelayError(400, 'La nueva fecha no puede estar en el pasado', 'newDueDate')
      }
      data.fechaLimite = date
    } else if (action === 'priorizar') {
      data.prioridad = 'Urgente'
    } else {
      data.estado = 'En Curso'
    }

    const row = await prisma.ordenTrabajo.update({
      where: { id: orderId },
      data,
      include: { cliente: true, operador: true },
    })
    await auditService.log({
      modulo: 'ordenes',
      accion: 'gestionar_retraso',
      valorAnterior: { orderId, estado: order.estado, prioridad: order.prioridad },
      valorNuevo: { orderId, action, ...data },
      idUsuario: userId,
    })
    // Un cambio de estado por intervención también es un cambio de estado (RF29)
    if (data.estado && data.estado !== order.estado) {
      await auditService.log({
        modulo: 'ordenes',
        accion: 'cambio_estado',
        valorAnterior: { orderId, estado: order.estado },
        valorNuevo: { orderId, estado: data.estado },
        idUsuario: userId,
      })
    }
    return toOrderDto(row)
  },
}
