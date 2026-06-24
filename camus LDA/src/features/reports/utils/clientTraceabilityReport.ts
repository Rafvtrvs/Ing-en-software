import type { AuditLogEntry } from '@/data/mock/audit'
import { normalizeRut } from '@/features/clients/utils/clientDuplicates'
import type { ChartDataPoint, Client, Invoice, WorkOrder } from '@/types'

const MONTH_LABELS = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
]

export function parseOrderDate(createdAt: string): Date | null {
  const slash = createdAt.split('/')
  if (slash.length === 3) {
    const [dd, mm, yyyy] = slash.map(Number)
    if (![dd, mm, yyyy].some((n) => Number.isNaN(n))) {
      return new Date(yyyy, mm - 1, dd)
    }
  }
  const iso = new Date(createdAt)
  return Number.isNaN(iso.getTime()) ? null : iso
}

export function filterClientsBySearch(clients: Client[], query: string): Client[] {
  const q = query.toLowerCase().trim()
  if (!q) return clients
  return clients.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.company.toLowerCase().includes(q) ||
      c.rut.includes(q) ||
      c.email.toLowerCase().includes(q),
  )
}

export function clientMatchesOrder(client: Client, order: WorkOrder): boolean {
  const orderClient = order.client.toLowerCase().trim()
  const name = client.name.toLowerCase().trim()
  const company = client.company.toLowerCase().trim()
  return orderClient === name || orderClient === company
}

export function clientMatchesInvoice(client: Client, invoice: Invoice): boolean {
  if (normalizeRut(invoice.clientRut) === normalizeRut(client.rut)) return true
  const invoiceClient = invoice.client.toLowerCase().trim()
  const name = client.name.toLowerCase().trim()
  const company = client.company.toLowerCase().trim()
  return invoiceClient === name || invoiceClient === company
}

export function clientMatchesAuditLog(client: Client, log: AuditLogEntry): boolean {
  const terms = [client.name, client.company, client.rut, normalizeRut(client.rut)]
  const haystack = [log.valorNuevo, log.valorAnterior, log.accion, log.moduloAfectado]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  return terms.some((t) => haystack.includes(t.toLowerCase()))
}

export function getOrdersForClient(client: Client, orders: WorkOrder[]): WorkOrder[] {
  return orders
    .filter((o) => clientMatchesOrder(client, o))
    .sort((a, b) => {
      const da = parseOrderDate(a.createdAt)?.getTime() ?? 0
      const db = parseOrderDate(b.createdAt)?.getTime() ?? 0
      return db - da
    })
}

export function getInvoicesForClient(client: Client, invoices: Invoice[]): Invoice[] {
  return invoices.filter((i) => clientMatchesInvoice(client, i))
}

export function getAuditLogsForClient(
  client: Client,
  logs: AuditLogEntry[],
): AuditLogEntry[] {
  return logs
    .filter((l) => clientMatchesAuditLog(client, l))
    .sort((a, b) => new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime())
}

export function getClientVisitRecurrence(orders: WorkOrder[]): ChartDataPoint[] {
  const buckets = new Map<string, { label: string; value: number; sortKey: string }>()

  for (const order of orders) {
    const date = parseOrderDate(order.createdAt)
    if (!date) continue
    const sortKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const label = `${MONTH_LABELS[date.getMonth()]} ${date.getFullYear()}`
    const current = buckets.get(sortKey)
    if (current) {
      current.value += 1
    } else {
      buckets.set(sortKey, { label, value: 1, sortKey })
    }
  }

  return Array.from(buckets.values())
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
    .map(({ label, value }) => ({ name: label, value }))
}

export interface ClientManagementReport {
  client: Client
  totalServices: number
  orders: WorkOrder[]
  invoices: Invoice[]
  auditEvents: AuditLogEntry[]
  visitRecurrence: ChartDataPoint[]
  completedServices: number
  activeServices: number
  totalBilled: number
}

export function buildClientManagementReport(
  client: Client,
  orders: WorkOrder[],
  invoices: Invoice[],
  logs: AuditLogEntry[],
): ClientManagementReport {
  const linkedOrders = getOrdersForClient(client, orders)
  const linkedInvoices = getInvoicesForClient(client, invoices)
  const auditEvents = getAuditLogsForClient(client, logs)

  return {
    client,
    totalServices: linkedOrders.length,
    orders: linkedOrders,
    invoices: linkedInvoices,
    auditEvents,
    visitRecurrence: getClientVisitRecurrence(linkedOrders),
    completedServices: linkedOrders.filter((o) => o.status === 'Completada').length,
    activeServices: linkedOrders.filter((o) =>
      ['Pendiente', 'En Curso', 'Abonado'].includes(o.status),
    ).length,
    totalBilled: linkedInvoices.reduce((sum, inv) => sum + inv.amount, 0),
  }
}
