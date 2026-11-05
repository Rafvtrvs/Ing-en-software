import { BarChart3, ClipboardList, DollarSign, Package, Users } from 'lucide-react'
import type {
  ChartDataPoint,
  Client,
  Invoice,
  KpiData,
  OrderStatus,
  Product,
  StockMovement,
  WorkOrder,
} from '@/types'
import { isConsumableStockCategory } from '@/features/inventory/utils/stockCategories'
import { computeStockStatus } from '@/features/inventory/utils/inventoryStatus'

const MONTH_SHORT = [
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
] as const

function parseFlexibleDate(value?: string | null): Date | null {
  if (!value?.trim()) return null
  const v = value.trim()
  if (/^\d{4}-\d{2}-\d{2}/.test(v)) {
    const d = new Date(`${v.slice(0, 10)}T12:00:00`)
    return Number.isNaN(d.getTime()) ? null : d
  }
  const m = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (m) {
    const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]), 12)
    return Number.isNaN(d.getTime()) ? null : d
  }
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? null : d
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function lastNMonthBuckets(n: number): { key: string; label: string }[] {
  const now = new Date()
  const buckets: { key: string; label: string }[] = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1, 12)
    buckets.push({
      key: monthKey(d),
      label: MONTH_SHORT[d.getMonth()],
    })
  }
  return buckets
}

function formatKpiMoney(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1000) return `$${Math.round(value / 1000)}K`
  return `$${Math.round(value)}`
}

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
  const tracked = products
    .filter((p) => isConsumableStockCategory(p.category))
    .map((p) => ({
      ...p,
      status: computeStockStatus(p.currentStock, p.minStock, p.category),
    }))

  const statuses = [
    { key: 'Ok' as const, name: 'Óptimo', color: '#22c55e' },
    { key: 'Bajo' as const, name: 'Bajo', color: '#f59e0b' },
    { key: 'Crítico' as const, name: 'Crítico', color: '#ef4444' },
  ]

  return statuses
    .map(({ key, name, color }) => ({
      name,
      value: tracked.filter((p) => p.status === key).length,
      color,
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
  return products.filter(
    (p) =>
      isConsumableStockCategory(p.category) &&
      (p.status === 'Crítico' || p.status === 'Bajo'),
  ).length
}

export interface MostUsedProductStat {
  productId: string
  name: string
  unit: string
  value: number
}

/** Totales reales de uso desde insumos registrados en OT. Sin uso → lista vacía (0). */
export function getMostUsedProducts(
  orders: WorkOrder[],
  products: Product[],
  limit = 8,
): MostUsedProductStat[] {
  const totals = new Map<string, { name: string; unit: string; value: number }>()

  for (const order of orders) {
    for (const supply of order.suppliesUsed ?? []) {
      if (!supply.productId || supply.quantity <= 0) continue
      const product = products.find((p) => p.id === supply.productId)
      const prev = totals.get(supply.productId)
      totals.set(supply.productId, {
        name: product?.name ?? supply.productName,
        unit: product?.unit ?? 'un',
        value: (prev?.value ?? 0) + supply.quantity,
      })
    }
  }

  return Array.from(totals.entries())
    .map(([productId, row]) => ({ productId, ...row }))
    .filter((row) => row.value > 0)
    .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name, 'es'))
    .slice(0, limit)
}

/**
 * Productos más usados según movimientos de salida en Postgres.
 * Complementa (o reemplaza) el uso registrado en OT.
 */
export function getMostUsedProductsFromMovements(
  movements: StockMovement[],
  products: Product[],
  limit = 8,
): MostUsedProductStat[] {
  const totals = new Map<string, { name: string; unit: string; value: number }>()

  for (const mov of movements) {
    if (mov.type !== 'Salida' || mov.quantity <= 0 || !mov.productId) continue
    const product = products.find((p) => p.id === mov.productId)
    const prev = totals.get(mov.productId)
    totals.set(mov.productId, {
      name: product?.name ?? mov.product,
      unit: product?.unit ?? 'un',
      value: (prev?.value ?? 0) + mov.quantity,
    })
  }

  return Array.from(totals.entries())
    .map(([productId, row]) => ({ productId, ...row }))
    .filter((row) => row.value > 0)
    .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name, 'es'))
    .slice(0, limit)
}

/** Preferencia: salidas de stock en BD; si no hay, insumos de OT. */
export function getMostUsedInventoryProducts(
  orders: WorkOrder[],
  products: Product[],
  movements: StockMovement[],
  limit = 8,
): MostUsedProductStat[] {
  const fromMovements = getMostUsedProductsFromMovements(movements, products, limit)
  if (fromMovements.length > 0) return fromMovements
  return getMostUsedProducts(orders, products, limit)
}

/** KPIs del resumen a partir de totales reales del sistema. */
export function getSummaryReportKpis(stats: {
  totalOrders: number
  completedOrders: number
  totalRevenue: number
  criticalProducts: number
  activeClients: number
}): KpiData[] {
  const completionRate = stats.totalOrders
    ? Math.round((stats.completedOrders / stats.totalOrders) * 100)
    : 0

  return [
    {
      title: 'Órdenes Totales',
      value: String(stats.totalOrders),
      trend: `${completionRate}% completadas`,
      trendDirection: completionRate >= 70 ? 'up' : 'down',
      icon: ClipboardList,
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
    },
    {
      title: 'Ingresos Facturados',
      value: formatKpiMoney(stats.totalRevenue),
      trend:
        stats.totalRevenue > 0
          ? `${stats.completedOrders} OT completadas`
          : 'Sin facturación registrada',
      trendDirection: stats.totalRevenue > 0 ? 'up' : 'down',
      icon: DollarSign,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
    },
    {
      title: 'Clientes Activos',
      value: String(stats.activeClients),
      trend: 'Con estado activo',
      trendDirection: 'up',
      icon: Users,
      iconBg: 'bg-violet-50',
      iconColor: 'text-violet-600',
    },
    {
      title: 'Alertas Inventario',
      value: String(stats.criticalProducts),
      trend: stats.criticalProducts > 0 ? 'Requiere reposición' : 'Stock estable',
      trendDirection: stats.criticalProducts > 0 ? 'down' : 'up',
      icon: Package,
      iconBg: stats.criticalProducts > 0 ? 'bg-red-50' : 'bg-emerald-50',
      iconColor: stats.criticalProducts > 0 ? 'text-red-600' : 'text-emerald-600',
    },
  ]
}

/** Ingresos por mes desde facturas reales (últimos `months` meses). */
export function getRevenueByMonth(
  invoices: Invoice[],
  months = 6,
): { month: string; revenue: number }[] {
  const buckets = lastNMonthBuckets(months)
  const totals = new Map(buckets.map((b) => [b.key, 0]))

  for (const invoice of invoices) {
    if (invoice.status === 'Anulada' || invoice.status === 'Borrador') continue
    const d = parseFlexibleDate(invoice.issueDate)
    if (!d) continue
    const key = monthKey(d)
    if (!totals.has(key)) continue
    totals.set(key, (totals.get(key) ?? 0) + (invoice.amount ?? 0))
  }

  return buckets.map((b) => ({
    month: b.label,
    revenue: totals.get(b.key) ?? 0,
  }))
}

/** Evolución de órdenes por mes (fecha de emisión / creación). */
export function getOrdersTrendByMonth(
  orders: WorkOrder[],
  months = 6,
): { month: string; orders: number }[] {
  const buckets = lastNMonthBuckets(months)
  const totals = new Map(buckets.map((b) => [b.key, 0]))

  for (const order of orders) {
    const d = parseFlexibleDate(
      order.createdAt || order.startDate || order.executionDate,
    )
    if (!d) continue
    const key = monthKey(d)
    if (!totals.has(key)) continue
    totals.set(key, (totals.get(key) ?? 0) + 1)
  }

  return buckets.map((b) => ({
    month: b.label,
    orders: totals.get(b.key) ?? 0,
  }))
}

/** Top clientes por cantidad de OT reales. */
export function getTopClientsByOrders(
  orders: WorkOrder[],
  limit = 5,
): ChartDataPoint[] {
  const map = new Map<string, number>()
  for (const order of orders) {
    const name = order.client?.trim() || 'Sin cliente'
    map.set(name, (map.get(name) ?? 0) + 1)
  }
  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name, 'es'))
    .slice(0, limit)
}

export function getOrdersReportKpis(stats: {
  total: number
  pending: number
  inProgress: number
  completed: number
}): KpiData[] {
  return [
    {
      title: 'Total Órdenes',
      value: String(stats.total),
      trend: 'En el período',
      trendDirection: 'up',
      icon: ClipboardList,
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
    },
    {
      title: 'Pendientes',
      value: String(stats.pending),
      trend: `${stats.total ? Math.round((stats.pending / stats.total) * 100) : 0}% del total`,
      trendDirection: 'down',
      icon: BarChart3,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
    },
    {
      title: 'En Curso',
      value: String(stats.inProgress),
      trend: 'Activas ahora',
      trendDirection: 'up',
      icon: BarChart3,
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
    },
    {
      title: 'Completadas',
      value: String(stats.completed),
      trend: `${stats.total ? Math.round((stats.completed / stats.total) * 100) : 0}% del total`,
      trendDirection: 'up',
      icon: ClipboardList,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
    },
  ]
}

