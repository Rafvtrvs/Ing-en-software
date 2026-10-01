import type { ChartDataPoint, OrderStatus, WorkOrder } from '@/types'
import { parseOrderDate } from '@/features/reports/utils/clientTraceabilityReport'
import { CHART_PALETTES } from '@/store/useSettingsStore'

export type PriorityFilter = 'Todas' | 'Baja' | 'Media' | 'Alta'

/** Días sin avance para considerar una OT atrasada (CU-181) */
export const OVERDUE_DAYS_THRESHOLD = 7

const STATUS_ORDER: OrderStatus[] = [
  'Pendiente',
  'En Curso',
  'Completada',
  'Abonado',
  'Cancelada',
]

function paletteColors(): string[] {
  try {
    const key =
      (typeof document !== 'undefined' &&
        (document.documentElement.dataset.chartPalette as keyof typeof CHART_PALETTES)) ||
      'default'
    return CHART_PALETTES[key] ?? CHART_PALETTES.default
  } catch {
    return CHART_PALETTES.default
  }
}

export function filterOrdersByPriority(
  orders: WorkOrder[],
  priority: PriorityFilter,
): WorkOrder[] {
  if (priority === 'Todas') return orders
  return orders.filter((o) => (o.priority ?? 'Media') === priority)
}

export function buildOrdersByStatus(orders: WorkOrder[]): ChartDataPoint[] {
  const colors = paletteColors()
  return STATUS_ORDER.map((status, index) => ({
    name: status,
    value: orders.filter((o) => o.status === status).length,
    color: colors[index % colors.length],
  }))
}

export function buildOrdersByCategory(orders: WorkOrder[]): ChartDataPoint[] {
  const counts = new Map<string, number>()
  for (const o of orders) {
    counts.set(o.category, (counts.get(o.category) ?? 0) + 1)
  }
  return Array.from(counts.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
}

const MONTH_LABELS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

export function buildOrdersByMonth(orders: WorkOrder[]): { month: string; orders: number }[] {
  const now = new Date()
  const months: { key: string; month: string; year: number; monthIndex: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      month: MONTH_LABELS[d.getMonth()],
      year: d.getFullYear(),
      monthIndex: d.getMonth(),
    })
  }

  return months.map((m) => {
    const count = orders.filter((o) => {
      const date = parseOrderDate(o.createdAt)
      if (!date) return false
      return date.getFullYear() === m.year && date.getMonth() === m.monthIndex
    }).length
    return { month: m.month, orders: count }
  })
}

function referenceDate(order: WorkOrder): Date | null {
  const start = order.startDate ? parseOrderDate(order.startDate) : null
  if (start) return start
  return parseOrderDate(order.createdAt)
}

/** OT Pendiente/En Curso con fecha de inicio o creación más antigua que N días */
export function getOverdueOrders(
  orders: WorkOrder[],
  thresholdDays = OVERDUE_DAYS_THRESHOLD,
  now = new Date(),
): WorkOrder[] {
  const ms = thresholdDays * 24 * 60 * 60 * 1000
  return orders
    .filter((o) => o.status === 'Pendiente' || o.status === 'En Curso')
    .filter((o) => {
      const ref = referenceDate(o)
      if (!ref) return false
      return now.getTime() - ref.getTime() > ms
    })
    .sort((a, b) => {
      const da = referenceDate(a)?.getTime() ?? 0
      const db = referenceDate(b)?.getTime() ?? 0
      return da - db
    })
}

export function daysOverdue(order: WorkOrder, now = new Date()): number {
  const ref = referenceDate(order)
  if (!ref) return 0
  return Math.floor((now.getTime() - ref.getTime()) / (24 * 60 * 60 * 1000))
}
