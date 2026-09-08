import type { Client, WorkOrder } from '@/types'

/** RF69 CDS 237 — órdenes activas asociadas a un cliente */
export function getClientOrders(client: Client, orders: WorkOrder[]): WorkOrder[] {
  return orders.filter(
    (o) => o.client === client.name || o.client === client.company,
  )
}

export function getClientActiveOrders(client: Client, orders: WorkOrder[]): WorkOrder[] {
  return getClientOrders(client, orders).filter(
    (o) => o.status === 'Pendiente' || o.status === 'En Curso',
  )
}
