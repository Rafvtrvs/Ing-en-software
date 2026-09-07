import type { Invoice } from '@/types'
import { formatCurrency } from '@/utils/formatters'

export function exportInvoicesToCsv(invoices: Invoice[]) {
  const headers = [
    'Número',
    'Cliente',
    'RUT',
    'Orden',
    'Emisión',
    'Vencimiento',
    'Monto',
    'Estado',
  ]
  const rows = invoices.map((i) => [
    i.number,
    i.client,
    i.clientRut,
    i.orderId ?? '',
    i.issueDate,
    i.dueDate,
    String(i.amount),
    i.status,
  ])
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `facturas_${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

export function formatInvoiceAmount(amount: number) {
  return formatCurrency(amount)
}
