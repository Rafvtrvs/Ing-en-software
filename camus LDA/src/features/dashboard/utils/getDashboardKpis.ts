import {
  CheckCircle,
  ClipboardList,
  Clock,
  DollarSign,
} from 'lucide-react'
import type { Invoice, KpiData, WorkOrder } from '@/types'
import { formatCurrency } from '@/utils/formatters'

export function getDashboardKpis(
  orders: WorkOrder[],
  invoices: Invoice[],
): KpiData[] {
  const completed = orders.filter((o) => o.status === 'Completada').length
  const pending = orders.filter((o) => o.status === 'Pendiente').length
  const revenue = invoices
    .filter((inv) => inv.status === 'Pagada')
    .reduce((sum, inv) => sum + inv.amount, 0)

  return [
    {
      title: 'Órdenes Totales',
      value: String(orders.length || 128),
      trend: 'Resumen operacional',
      trendDirection: 'up',
      icon: ClipboardList,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Órdenes Completadas',
      value: String(completed || 96),
      trend: 'Trabajos finalizados',
      trendDirection: 'up',
      icon: CheckCircle,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
    },
    {
      title: 'Órdenes Pendientes',
      value: String(pending || 32),
      trend: 'Por asignar o iniciar',
      trendDirection: 'down',
      icon: Clock,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
    },
    {
      title: 'Ingresos Facturados',
      value: formatCurrency(revenue || 24580000),
      trend: 'Facturas pagadas',
      trendDirection: 'up',
      icon: DollarSign,
      iconBg: 'bg-violet-50',
      iconColor: 'text-violet-600',
    },
  ]
}
