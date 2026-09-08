import type { OrderOperator, OrderStatus, WorkOrder } from '@/types'
import { formatDisplayDate } from '@/features/orders/utils/orderDates'

export type OperatorAvailabilityStatus = 'Disponible' | 'Ocupado'

export interface OperatorAssignmentSlot {
  orderId: string
  client: string
  status: OrderStatus
  startDate?: string
  endDate?: string
  periodLabel: string
}

export interface OperatorAvailabilityRow {
  operator: OrderOperator
  status: OperatorAvailabilityStatus
  activeOrders: number
  assignedOrderIds: string[]
  assignments: OperatorAssignmentSlot[]
  occupiedPeriodLabel: string
}

function isOrderActive(order: WorkOrder): boolean {
  return order.status === 'Pendiente' || order.status === 'En Curso'
}

function orderMatchesOperator(
  order: WorkOrder,
  operatorId: string,
  operatorName: string,
): boolean {
  if (order.operatorIds?.includes(operatorId)) return true
  if (order.technician === operatorName) return true
  return order.operators?.some((o) => o.id === operatorId) ?? false
}

function normalizeDate(value: string): string {
  if (value.includes('/')) {
    const [d, m, y] = value.split('/')
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }
  return value.slice(0, 10)
}

function slotPeriod(order: WorkOrder): string {
  const start = order.startDate ?? order.createdAt
  const end = order.endDate ?? order.startDate ?? order.createdAt
  if (!start) return 'Sin fecha programada'
  const startLabel = formatDisplayDate(start)
  if (!end || normalizeDate(end) === normalizeDate(start)) {
    return startLabel
  }
  return `${startLabel} – ${formatDisplayDate(end)}`
}

function buildOccupiedPeriod(assignments: OperatorAssignmentSlot[]): string {
  if (assignments.length === 0) return '—'
  const dates = assignments.flatMap((a) => {
    const parts: string[] = []
    if (a.startDate) parts.push(normalizeDate(a.startDate))
    if (a.endDate) parts.push(normalizeDate(a.endDate))
    return parts
  })
  if (dates.length === 0) {
    return `${assignments.length} OT activa(s)`
  }
  const sorted = [...dates].sort()
  const from = formatDisplayDate(sorted[0])
  const to = formatDisplayDate(sorted[sorted.length - 1])
  if (from === to) {
    return `${from} · ${assignments.length} OT`
  }
  return `${from} – ${to} · ${assignments.length} OT`
}

/** RF60 CDS 209 — disponibilidad según asignaciones y rango de fechas */
export function computeOperatorAvailability(
  operators: OrderOperator[],
  orders: WorkOrder[],
  options?: {
    orderId?: string
    dateFrom?: string
    dateTo?: string
  },
): OperatorAvailabilityRow[] {
  let relevantOrders = orders.filter(isOrderActive)

  if (options?.orderId) {
    const target = orders.find((o) => o.id === options.orderId)
    relevantOrders = target && isOrderActive(target) ? [target] : []
  }

  if (options?.dateFrom || options?.dateTo) {
    relevantOrders = relevantOrders.filter((o) => {
      const ref = normalizeDate(o.startDate ?? o.createdAt ?? '')
      if (!ref) return true
      if (options.dateFrom && ref < options.dateFrom) return false
      if (options.dateTo && ref > options.dateTo) return false
      return true
    })
  }

  return operators.map((operator) => {
    const assigned = relevantOrders.filter((o) =>
      orderMatchesOperator(o, operator.id, operator.name),
    )
    const assignments: OperatorAssignmentSlot[] = assigned.map((o) => ({
      orderId: o.id,
      client: o.client,
      status: o.status,
      startDate: o.startDate ?? o.createdAt,
      endDate: o.endDate,
      periodLabel: slotPeriod(o),
    }))

    return {
      operator,
      status: assigned.length > 0 ? 'Ocupado' : 'Disponible',
      activeOrders: assigned.length,
      assignedOrderIds: assigned.map((o) => o.id),
      assignments,
      occupiedPeriodLabel: buildOccupiedPeriod(assignments),
    }
  })
}

/** RF60 CDS 210 — órdenes asignadas a un operador */
export function getOperatorAssignments(
  operatorId: string,
  operatorName: string,
  orders: WorkOrder[],
): WorkOrder[] {
  return orders.filter((o) => orderMatchesOperator(o, operatorId, operatorName))
}

export function exportAvailabilityToCsv(rows: OperatorAvailabilityRow[]): void {
  const header =
    'Operador,Estado,OT Activas,Periodo Ocupado,Asignaciones\n'
  const body = rows
    .map(
      (r) =>
        `"${r.operator.name}","${r.status}",${r.activeOrders},"${r.occupiedPeriodLabel}","${r.assignments.map((a) => `${a.orderId} (${a.periodLabel})`).join('; ')}"`,
    )
    .join('\n')
  const blob = new Blob([header + body], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `disponibilidad-operadores-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
