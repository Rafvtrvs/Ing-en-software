import type { ClientDeadline, ClientOrder, WorkOrder } from '@/types'
import { formatDisplayDate } from '@/features/orders/utils/orderDates'

function parseOrderDate(value?: string | null): number {
  if (!value?.trim()) return 0
  const v = value.trim()
  if (/^\d{4}-\d{2}-\d{2}/.test(v)) {
    const t = new Date(v.slice(0, 10) + 'T12:00:00').getTime()
    return Number.isNaN(t) ? 0 : t
  }
  const m = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (m) {
    const t = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]), 12).getTime()
    return Number.isNaN(t) ? 0 : t
  }
  const t = new Date(v).getTime()
  return Number.isNaN(t) ? 0 : t
}

function orderActivityDate(order: WorkOrder): string {
  return (
    order.startDate ||
    order.executionDate ||
    order.createdAt ||
    order.dueDate ||
    ''
  )
}

function startOfToday(): number {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/** Últimas OT desde Postgres/store (más recientes primero). */
export function getRecentOrdersByClient(
  orders: WorkOrder[],
  limit = 8,
): ClientOrder[] {
  return [...orders]
    .sort(
      (a, b) =>
        parseOrderDate(orderActivityDate(b)) -
        parseOrderDate(orderActivityDate(a)),
    )
    .slice(0, limit)
    .map((o) => {
      const raw = orderActivityDate(o)
      return {
        id: o.id,
        client: o.client || 'Sin cliente',
        service: o.service || o.category || '—',
        status: o.status,
        date: raw ? formatDisplayDate(raw) : '—',
        technician: o.technician || o.operators?.[0]?.name || 'Sin asignar',
      }
    })
}

/**
 * Próximos vencimientos = fecha límite (dueDate) de OT abiertas en Postgres.
 * Vacío si no hay fechas límite futuras.
 */
export function getUpcomingOrderDeadlines(
  orders: WorkOrder[],
  limit = 8,
): ClientDeadline[] {
  const today = startOfToday()
  const closed = new Set(['Completada', 'Cancelada', 'Anulada'])

  return [...orders]
    .filter((o) => {
      if (closed.has(o.status)) return false
      if (!o.dueDate?.trim()) return false
      const t = parseOrderDate(o.dueDate)
      return t >= today
    })
    .sort((a, b) => parseOrderDate(a.dueDate) - parseOrderDate(b.dueDate))
    .slice(0, limit)
    .map((o) => ({
      id: o.id,
      client: o.client || 'Sin cliente',
      reason: `Fecha límite OT ${o.id}`,
      date: formatDisplayDate(o.dueDate!),
    }))
}
