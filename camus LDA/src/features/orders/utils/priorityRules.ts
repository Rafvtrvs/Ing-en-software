import type { IncidentType, OrderPriority } from '@/types'

/** Prioridad sugerida según tipo de incidente (CU-165 / CU-170) */
export const INCIDENT_AUTO_PRIORITY: Record<IncidentType, OrderPriority> = {
  Colapso: 'Urgente',
  Fuga: 'Alta',
  'Rotura de Tubería': 'Alta',
  Rebalse: 'Alta',
  Obstrucción: 'Media',
  Mantención: 'Baja',
  Otros: 'Media',
}

export const INCIDENT_TYPES: IncidentType[] = [
  'Obstrucción',
  'Fuga',
  'Colapso',
  'Rotura de Tubería',
  'Rebalse',
  'Mantención',
  'Otros',
]

export const PRIORITY_RANK: Record<OrderPriority, number> = {
  Urgente: 0,
  Alta: 1,
  Media: 2,
  Baja: 3,
}

export function autoPriorityForIncident(
  incidentType?: IncidentType | string | null,
): OrderPriority {
  if (!incidentType) return 'Media'
  return (
    INCIDENT_AUTO_PRIORITY[incidentType as IncidentType] ?? 'Media'
  )
}

/** Resuelve prioridad: manual gana; si no, auto por incidente */
export function resolveOrderPriority(opts: {
  priority?: OrderPriority
  priorityManual?: boolean
  incidentType?: IncidentType | string | null
}): OrderPriority {
  if (opts.priorityManual && opts.priority) return opts.priority
  if (opts.incidentType) return autoPriorityForIncident(opts.incidentType)
  return opts.priority ?? 'Media'
}

export function comparePriorityDesc(
  a?: OrderPriority | null,
  b?: OrderPriority | null,
): number {
  const ra = PRIORITY_RANK[(a ?? 'Media') as OrderPriority] ?? 2
  const rb = PRIORITY_RANK[(b ?? 'Media') as OrderPriority] ?? 2
  return ra - rb
}

export function isUrgentPriority(priority?: OrderPriority | null): boolean {
  return priority === 'Urgente' || priority === 'Alta'
}
