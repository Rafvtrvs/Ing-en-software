import {
  CheckCircle,
  ClipboardList,
  Clock,
  DollarSign,
  LoaderCircle,
} from 'lucide-react'
import type { Invoice, KpiData, WorkOrder } from '@/types'
import { formatCurrency } from '@/utils/formatters'

export function getDashboardKpis(
  orders: WorkOrder[],
  invoices: Invoice[],
): KpiData[] {
  const completed = orders.filter((o) => o.status === 'Completada').length
  const pending = orders.filter((o) => o.status === 'Pendiente').length
  const inProgress = orders.filter((o) => o.status === 'En Curso')
  const avgProgress =
    inProgress.length === 0
      ? 0
      : Math.round(
          inProgress.reduce((sum, o) => sum + (o.progress ?? 0), 0) / inProgress.length,
        )
  const revenue = invoices
    .filter((inv) => inv.status === 'Pagada')
    .reduce((sum, inv) => sum + inv.amount, 0)

  return [
    {
      title: 'Órdenes Totales',
      value: String(orders.length),
      trend: 'Resumen operacional',
      trendDirection: 'up',
      icon: ClipboardList,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Órdenes Completadas',
      value: String(completed),
      trend: 'Trabajos finalizados',
      trendDirection: 'up',
      icon: CheckCircle,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
    },
    {
      title: 'Órdenes Pendientes',
      value: String(pending),
      trend: 'Por asignar o iniciar',
      trendDirection: 'down',
      icon: Clock,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
    },
    {
      title: 'Avance de servicios',
      value: inProgress.length === 0 ? '—' : `${avgProgress}%`,
      trend:
        inProgress.length === 0
          ? 'Sin OT en curso'
          : `${inProgress.length} OT en curso`,
      trendDirection: 'up',
      icon: LoaderCircle,
      iconBg: 'bg-sky-50',
      iconColor: 'text-sky-600',
    },
    {
      title: 'Ingresos Facturados',
      value: formatCurrency(revenue),
      trend: 'Facturas pagadas',
      trendDirection: 'up',
      icon: DollarSign,
      iconBg: 'bg-violet-50',
      iconColor: 'text-violet-600',
    },
  ]
}
