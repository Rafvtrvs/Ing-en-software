import type { Client, Invoice, Product, TechnicianPerformance, WorkOrder } from '@/types'

function downloadCsv(filename: string, headers: string[], rows: string[][]) {
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function exportOrdersReport(orders: WorkOrder[]) {
  downloadCsv(
    `reporte-ordenes_${dateSuffix()}.csv`,
    ['ID', 'Cliente', 'Categoría', 'Estado', 'Técnico', 'Fecha'],
    orders.map((o) => [
      o.id,
      o.client,
      o.category,
      o.status,
      o.technician ?? '',
      o.createdAt,
    ]),
  )
}

export function exportInvoicesReport(invoices: Invoice[]) {
  downloadCsv(
    `reporte-facturas_${dateSuffix()}.csv`,
    ['Número', 'Cliente', 'Monto', 'Estado', 'Emisión', 'Vencimiento'],
    invoices.map((i) => [
      i.number,
      i.client,
      String(i.amount),
      i.status,
      i.issueDate,
      i.dueDate,
    ]),
  )
}

export function exportInventoryReport(products: Product[]) {
  downloadCsv(
    `reporte-inventario_${dateSuffix()}.csv`,
    ['Código', 'Producto', 'Categoría', 'Stock', 'Mínimo', 'Estado'],
    products.map((p) => [
      p.code,
      p.name,
      p.category,
      String(p.currentStock),
      String(p.minStock),
      p.status,
    ]),
  )
}

export function exportTechniciansReport(technicians: TechnicianPerformance[]) {
  downloadCsv(
    `reporte-tecnicos_${dateSuffix()}.csv`,
    ['Técnico', 'Completadas', 'En curso', 'Días promedio', 'Calificación'],
    technicians.map((t) => [
      t.name,
      String(t.completedOrders),
      String(t.inProgress),
      String(t.avgCompletionDays),
      String(t.rating),
    ]),
  )
}

export function exportClientsReport(clients: Client[]) {
  downloadCsv(
    `reporte-clientes_${dateSuffix()}.csv`,
    ['Nombre', 'Empresa', 'RUT', 'Estado', 'Última orden'],
    clients.map((c) => [c.name, c.company, c.rut, c.status, c.lastOrder]),
  )
}

function dateSuffix() {
  return new Date().toISOString().slice(0, 10)
}
