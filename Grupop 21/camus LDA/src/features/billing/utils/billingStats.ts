import type { ChartDataPoint, Invoice, InvoiceStatus } from '@/types'

const statusColors: Record<InvoiceStatus, string> = {
  Borrador: '#94a3b8',
  Emitida: '#3b82f6',
  Pagada: '#22c55e',
  Vencida: '#ef4444',
  Anulada: '#cbd5e1',
}

const statusOrder: InvoiceStatus[] = [
  'Emitida',
  'Pagada',
  'Vencida',
  'Borrador',
  'Anulada',
]

export function getInvoicesByStatus(invoices: Invoice[]): ChartDataPoint[] {
  return statusOrder
    .map((status) => ({
      name: status,
      value: invoices.filter((i) => i.status === status).length,
      color: statusColors[status],
    }))
    .filter((item) => item.value > 0)
}

export function getUpcomingDue(invoices: Invoice[], limit = 4) {
  const today = new Date()
  return invoices
    .filter((i) => i.status === 'Emitida' || i.status === 'Vencida')
    .map((i) => ({
      ...i,
      due: new Date(i.dueDate),
    }))
    .sort((a, b) => a.due.getTime() - b.due.getTime())
    .slice(0, limit)
    .map((i) => {
      const diff = Math.ceil((i.due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      return { invoice: i, daysLeft: diff }
    })
}
