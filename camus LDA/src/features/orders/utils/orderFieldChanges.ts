import type { WorkOrder } from '@/types'
import { toInputDate } from '@/features/orders/utils/orderDates'

export const ORDER_FIELD_LABELS: Record<string, string> = {
  id: 'ID de orden',
  client: 'Cliente',
  address: 'Dirección',
  service: 'Servicio',
  category: 'Categoría',
  status: 'Estado',
  priority: 'Prioridad',
  technician: 'Técnico',
  progress: 'Progreso',
  startDate: 'Fecha inicio',
  endDate: 'Fecha término',
  durationHours: 'Duración (h)',
  incidentType: 'Tipo incidente',
  truckCode: 'Camión',
  dueDate: 'Fecha límite',
}

const TRACKED_FIELDS = [
  'id',
  'client',
  'address',
  'service',
  'category',
  'status',
  'priority',
  'technician',
  'progress',
  'startDate',
  'endDate',
  'durationHours',
  'incidentType',
  'truckCode',
  'dueDate',
] as const

export type TrackedOrderField = (typeof TRACKED_FIELDS)[number]

export interface OrderFieldChange {
  field: TrackedOrderField
  label: string
  from: string
  to: string
}

const DATE_FIELDS = new Set<TrackedOrderField>(['startDate', 'endDate', 'dueDate'])

function normalizeFieldValue(field: TrackedOrderField, value: unknown): string {
  if (field === 'progress' || field === 'durationHours') {
    if (field === 'durationHours' && (value === '' || value == null)) return ''
    const num = Number(value ?? 0)
    return Number.isFinite(num) ? String(num) : '0'
  }
  if (DATE_FIELDS.has(field)) return toInputDate(value == null ? '' : String(value))
  return String(value ?? '').trim()
}

function displayValue(field: TrackedOrderField, value: unknown): string {
  const normalized = normalizeFieldValue(field, value)
  if (field === 'progress') return `${normalized}%`
  if (field === 'durationHours') return `${normalized} h`
  return normalized || '—'
}

export function getOrderFieldChanges(
  before: WorkOrder,
  after: Partial<WorkOrder>,
): OrderFieldChange[] {
  const changes: OrderFieldChange[] = []

  const startSame =
    normalizeFieldValue('startDate', before.startDate) ===
    normalizeFieldValue('startDate', after.startDate ?? before.startDate)
  const endSame =
    normalizeFieldValue('endDate', before.endDate) ===
    normalizeFieldValue('endDate', after.endDate ?? before.endDate)

  for (const field of TRACKED_FIELDS) {
    const fromRaw = before[field]
    const toRaw = after[field] ?? before[field]
    const fromNorm = normalizeFieldValue(field, fromRaw)
    const toNorm = normalizeFieldValue(field, toRaw)

    // La duración se recalcula al enfocar las fechas; no es un cambio si el día no cambió.
    if (field === 'durationHours' && startSame && endSame) continue

    if (fromNorm !== toNorm) {
      changes.push({
        field,
        label: ORDER_FIELD_LABELS[field],
        from: displayValue(field, fromRaw),
        to: displayValue(field, toRaw),
      })
    }
  }

  const crewKey = (order?: Partial<WorkOrder>) =>
    [...(order?.operatorIds ?? order?.operators?.map((op) => op.id) ?? [])]
      .map((id) => String(id).trim())
      .filter(Boolean)
      .sort()
      .join(',')
  if (crewKey(before) !== crewKey(after)) {
    const crewLabel = (order?: Partial<WorkOrder>) => {
      const names = (order?.operators ?? [])
        .map((op) => op.name.trim())
        .filter(Boolean)
      if (names.length) return names.join(', ')
      return order?.technician?.trim() || '—'
    }
    changes.push({
      field: 'technician',
      label: 'Cuadrilla',
      from: crewLabel(before),
      to: crewLabel(after),
    })
  }

  return changes
}

export function formatOrderChangesMessage(changes: OrderFieldChange[]): string {
  if (changes.length === 0) return ''
  if (changes.length === 1) {
    const [change] = changes
    return `${change.label}: "${change.from}" → "${change.to}"`
  }
  return changes
    .map((change) => `${change.label}: "${change.from}" → "${change.to}"`)
    .join(' · ')
}
