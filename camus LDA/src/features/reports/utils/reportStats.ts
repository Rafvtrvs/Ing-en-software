import type { ChartDataPoint, Client, Invoice, OrderStatus, Product, WorkOrder } from '@/types'

const orderStatusColors: Record<OrderStatus, string> = {
  Pendiente: '#3b82f6',
  'En Curso': '#eab308',
  Abonado: '#8b5cf6',
  Completada: '#22c55e',
  Cancelada: '#94a3b8',
}

export function getOrdersByStatusChart(orders: WorkOrder[]): ChartDataPoint[] {
  const statuses: OrderStatus[] = [
    'Pendiente',
    'En Curso',
    'Abonado',
    'Completada',
    'Cancelada',
  ]
  return statuses
    .map((status) => ({
      name: status,
      value: orders.filter((o) => o.status === status).length,
      color: orderStatusColors[status],
    }))
    .filter((item) => item.value > 0)
}

export function getOrdersByCategory(orders: WorkOrder[]): ChartDataPoint[] {
  const map = new Map<string, number>()
  for (const order of orders) {
    map.set(order.category, (map.get(order.category) ?? 0) + 1)
  }
  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
}

export function getInventoryStatusChart(products: Product[]): ChartDataPoint[] {
  const statuses = ['Ok', 'Bajo', 'Crítico'] as const
  const colors = { Ok: '#22c55e', Bajo: '#eab308', Crítico: '#ef4444' }
  return statuses
    .map((status) => ({
      name: status,
      value: products.filter((p) => p.status === status).length,
      color: colors[status],
    }))
    .filter((item) => item.value > 0)
}

export function getBillingRevenueStats(invoices: Invoice[]) {
  const valid = invoices.filter((i) => i.status !== 'Anulada' && i.status !== 'Borrador')
  const paid = invoices.filter((i) => i.status === 'Pagada')
  const pending = invoices.filter((i) => i.status === 'Emitida' || i.status === 'Vencida')
  return {
    totalBilled: valid.reduce((s, i) => s + i.amount, 0),
    totalCollected: paid.reduce((s, i) => s + i.amount, 0),
    pendingAmount: pending.reduce((s, i) => s + i.amount, 0),
    paidCount: paid.length,
    pendingCount: pending.length,
  }
}

export function getActiveClientsCount(clients: Client[]): number {
  return clients.filter((c) => c.status === 'Activo').length
}

export function getCriticalProductsCount(products: Product[]): number {
  return products.filter((p) => p.status === 'Crítico' || p.status === 'Bajo').length
}
