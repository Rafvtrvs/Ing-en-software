import type { WorkOrder } from '@/types'

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
] as const

export type TrackedOrderField = (typeof TRACKED_FIELDS)[number]

export interface OrderFieldChange {
  field: TrackedOrderField
  label: string
  from: string
  to: string
}

function normalizeFieldValue(field: TrackedOrderField, value: unknown): string {
  if (field === 'progress') {
    const num = Number(value ?? 0)
    return Number.isFinite(num) ? String(num) : '0'
  }
  return String(value ?? '').trim()
}

function displayValue(field: TrackedOrderField, value: unknown): string {
  const normalized = normalizeFieldValue(field, value)
  if (field === 'progress') return `${normalized}%`
  return normalized || '—'
}

export function getOrderFieldChanges(
  before: WorkOrder,
  after: Partial<WorkOrder>,
): OrderFieldChange[] {
  const changes: OrderFieldChange[] = []

  for (const field of TRACKED_FIELDS) {
    const fromRaw = before[field]
    const toRaw = after[field] ?? before[field]
    const fromNorm = normalizeFieldValue(field, fromRaw)
    const toNorm = normalizeFieldValue(field, toRaw)

    if (fromNorm !== toNorm) {
      changes.push({
        field,
        label: ORDER_FIELD_LABELS[field],
        from: displayValue(field, fromRaw),
        to: displayValue(field, toRaw),
      })
    }
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
