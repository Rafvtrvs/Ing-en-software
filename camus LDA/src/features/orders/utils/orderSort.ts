import type { OrderStatus, WorkOrder } from '@/types'

export const ORDER_STATUSES: OrderStatus[] = [
  'Pendiente',
  'En Curso',
  'Abonado',
  'Completada',
  'Cancelada',
]

export function getColumnOrders(orders: WorkOrder[], status: OrderStatus): WorkOrder[] {
  return orders
    .filter((o) => o.status === status)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
}

/** Asegura sortOrder 0..n-1 por columna (útil tras cargar datos antiguos). */
export function normalizeOrdersSort(orders: WorkOrder[]): WorkOrder[] {
  const byId = new Map<string, WorkOrder>()

  ORDER_STATUSES.forEach((status) => {
    getColumnOrders(orders, status).forEach((order, index) => {
      byId.set(order.id, { ...order, sortOrder: index })
    })
  })

  return orders.map((o) => byId.get(o.id) ?? o)
}

export function applySortOrderToColumn(
  orders: WorkOrder[],
  status: OrderStatus,
  orderedIds: string[],
): WorkOrder[] {
  const sortMap = new Map(orderedIds.map((id, index) => [id, index]))

  return orders.map((o) => {
    if (o.status !== status) return o
    const sortOrder = sortMap.get(o.id)
    return sortOrder !== undefined ? { ...o, sortOrder } : o
  })
}
