import { jsPDF } from 'jspdf'
import * as XLSX from 'xlsx'
import type { Client, Invoice, Product, TechnicianPerformance, WorkOrder } from '@/types'

function dateSuffix() {
  return new Date().toISOString().slice(0, 10)
}

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

/** RF-21 — Excel (.xlsx) real */
function downloadXlsx(
  filename: string,
  sheetName: string,
  headers: string[],
  rows: (string | number)[][],
) {
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows])
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31))
  XLSX.writeFile(workbook, filename)
}

function downloadSimplePdf(
  filename: string,
  title: string,
  lines: string[],
) {
  const doc = new jsPDF()
  doc.setFontSize(14)
  doc.text(title, 14, 18)
  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text(
    `Generado ${new Date().toLocaleString('es-CL')} · Alcantarillados Camus Ltda.`,
    14,
    26,
  )
  doc.setTextColor(0)
  let y = 36
  for (const raw of lines) {
    const wrapped = doc.splitTextToSize(raw, 180)
    if (y + wrapped.length * 5 > 280) {
      doc.addPage()
      y = 20
    }
    doc.text(wrapped, 14, y)
    y += wrapped.length * 5 + 3
  }
  doc.save(filename)
}

export function exportOrdersReport(orders: WorkOrder[], format: 'CSV' | 'XLSX' = 'CSV') {
  const headers = ['ID', 'Cliente', 'Categoría', 'Estado', 'Técnico', 'Fecha']
  const rows = orders.map((o) => [
    o.id,
    o.client,
    o.category,
    o.status,
    o.technician ?? '',
    o.createdAt,
  ])
  if (format === 'XLSX') {
    downloadXlsx(`reporte-ordenes_${dateSuffix()}.xlsx`, 'Ordenes', headers, rows)
    return
  }
  downloadCsv(`reporte-ordenes_${dateSuffix()}.csv`, headers, rows)
}

export function exportInvoicesReport(
  invoices: Invoice[],
  format: 'CSV' | 'XLSX' = 'CSV',
) {
  const headers = ['Número', 'Cliente', 'Monto', 'Estado', 'Emisión', 'Vencimiento']
  const rows = invoices.map((i) => [
    i.number,
    i.client,
    i.amount,
    i.status,
    i.issueDate,
    i.dueDate,
  ])
  if (format === 'XLSX') {
    downloadXlsx(`reporte-facturas_${dateSuffix()}.xlsx`, 'Facturas', headers, rows)
    return
  }
  downloadCsv(
    `reporte-facturas_${dateSuffix()}.csv`,
    headers,
    rows.map((row) => row.map(String)),
  )
}

export function exportInventoryReport(
  products: Product[],
  format: 'CSV' | 'XLSX' = 'CSV',
) {
  const headers = ['Código', 'Producto', 'Categoría', 'Stock', 'Mínimo', 'Estado']
  const rows = products.map((p) => [
    p.code,
    p.name,
    p.category,
    p.currentStock,
    p.minStock,
    p.status,
  ])
  if (format === 'XLSX') {
    downloadXlsx(`reporte-inventario_${dateSuffix()}.xlsx`, 'Inventario', headers, rows)
    return
  }
  downloadCsv(
    `reporte-inventario_${dateSuffix()}.csv`,
    headers,
    rows.map((row) => row.map(String)),
  )
}

export function exportTechniciansReport(
  technicians: TechnicianPerformance[],
  format: 'CSV' | 'XLSX' = 'CSV',
) {
  const headers = ['Técnico', 'Completadas', 'En curso', 'Días promedio', 'Calificación']
  const rows = technicians.map((t) => [
    t.name,
    t.completedOrders,
    t.inProgress,
    t.avgCompletionDays,
    t.rating,
  ])
  if (format === 'XLSX') {
    downloadXlsx(`reporte-tecnicos_${dateSuffix()}.xlsx`, 'Tecnicos', headers, rows)
    return
  }
  downloadCsv(
    `reporte-tecnicos_${dateSuffix()}.csv`,
    headers,
    rows.map((row) => row.map(String)),
  )
}

export function exportClientsReport(
  clients: Client[],
  format: 'CSV' | 'XLSX' = 'CSV',
) {
  const headers = ['Nombre', 'Empresa', 'RUT', 'Estado', 'Última orden']
  const rows = clients.map((c) => [c.name, c.company, c.rut, c.status, c.lastOrder])
  if (format === 'XLSX') {
    downloadXlsx(`reporte-clientes_${dateSuffix()}.xlsx`, 'Clientes', headers, rows)
    return
  }
  downloadCsv(`reporte-clientes_${dateSuffix()}.csv`, headers, rows)
}

function cell(value: unknown): string | number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (value == null) return ''
  return String(value)
}

/** Un solo .xlsx con varias hojas (evita el bloqueo del navegador a descargas múltiples). */
export function exportAllReportsPackage(data: {
  orders: WorkOrder[]
  invoices: Invoice[]
  products: Product[]
  technicians: TechnicianPerformance[]
  clients: Client[]
}) {
  const workbook = XLSX.utils.book_new()

  const sheets: { name: string; headers: string[]; rows: (string | number)[][] }[] = [
    {
      name: 'Ordenes',
      headers: ['ID', 'Cliente', 'Categoría', 'Estado', 'Técnico', 'Fecha'],
      rows: (data.orders ?? []).map((o) => [
        cell(o.id),
        cell(o.client),
        cell(o.category),
        cell(o.status),
        cell(o.technician),
        cell(o.createdAt),
      ]),
    },
    {
      name: 'Facturas',
      headers: ['Número', 'Cliente', 'Monto', 'Estado', 'Emisión', 'Vencimiento'],
      rows: (data.invoices ?? []).map((i) => [
        cell(i.number),
        cell(i.client),
        cell(i.amount),
        cell(i.status),
        cell(i.issueDate),
        cell(i.dueDate),
      ]),
    },
    {
      name: 'Inventario',
      headers: ['Código', 'Producto', 'Categoría', 'Stock', 'Mínimo', 'Estado'],
      rows: (data.products ?? []).map((p) => [
        cell(p.code),
        cell(p.name),
        cell(p.category),
        cell(p.currentStock),
        cell(p.minStock),
        cell(p.status),
      ]),
    },
    {
      name: 'Tecnicos',
      headers: ['Técnico', 'Completadas', 'En curso', 'Días promedio', 'Calificación'],
      rows: (data.technicians ?? []).map((t) => [
        cell(t.name),
        cell(t.completedOrders),
        cell(t.inProgress),
        cell(t.avgCompletionDays),
        cell(t.rating),
      ]),
    },
    {
      name: 'Clientes',
      headers: ['Nombre', 'Empresa', 'RUT', 'Estado', 'Última orden'],
      rows: (data.clients ?? []).map((c) => [
        cell(c.name),
        cell(c.company),
        cell(c.rut),
        cell(c.status),
        cell(c.lastOrder),
      ]),
    },
  ]

  for (const sheet of sheets) {
    const worksheet = XLSX.utils.aoa_to_sheet([sheet.headers, ...sheet.rows])
    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name.slice(0, 31))
  }

  const filename = `reporte-completo_${dateSuffix()}.xlsx`
  const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

/** RF-21 — PDF real de resumen ejecutivo */
export function exportExecutiveSummaryPdf(stats: {
  totalOrders: number
  completedOrders: number
  totalRevenue: number
  criticalProducts: number
  activeClients: number
}) {
  const completion = stats.totalOrders
    ? Math.round((stats.completedOrders / stats.totalOrders) * 100)
    : 0
  downloadSimplePdf(`resumen-ejecutivo_${dateSuffix()}.pdf`, 'Resumen Ejecutivo', [
    `Ordenes totales: ${stats.totalOrders}`,
    `Ordenes completadas: ${stats.completedOrders} (${completion}%)`,
    `Ingresos facturados: ${stats.totalRevenue}`,
    `Productos criticos: ${stats.criticalProducts}`,
    `Clientes activos: ${stats.activeClients}`,
  ])
}

export function exportCostsPdf(lines: string[]) {
  downloadSimplePdf(
    `costos-operacionales_${dateSuffix()}.pdf`,
    'Reporte de Costos Operacionales',
    lines.length ? lines : ['Sin datos de costos para el periodo.'],
  )
}

export function exportAssetsPdf(lines: string[]) {
  downloadSimplePdf(
    `uso-activos_${dateSuffix()}.pdf`,
    'Informe de Uso de Activos Fisicos',
    lines.length ? lines : ['Sin registros de uso de activos.'],
  )
}
