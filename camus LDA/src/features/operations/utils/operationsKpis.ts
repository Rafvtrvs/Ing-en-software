import { MapPin, Radio, Timer, Truck } from 'lucide-react'
import type { AppRole, KpiData, SystemUser, WorkOrder } from '@/types'

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function orderDay(order: WorkOrder): string {
  return (order.executionDate || order.startDate || order.createdAt || '').slice(0, 10)
}

/** KPIs de Operaciones en terreno a partir de OT y usuarios reales. */
export function getOperationsKpisFromData(
  orders: WorkOrder[],
  _users: SystemUser[],
  _roles: AppRole[],
): KpiData[] {
  const today = todayIso()
  const active = orders.filter(
    (o) => o.status === 'En Curso' || o.status === 'Pendiente',
  )
  const completed = orders.filter((o) => o.status === 'Completada' || o.status === 'Abonado')
  const waitingOrDelayed = orders.filter((o) => {
    if (o.status === 'Pendiente') return true
    if (o.status !== 'En Curso') return false
    const due = o.dueDate?.slice(0, 10)
    return Boolean(due && due < today)
  })
  const todayOrders = orders.filter(
    (o) => orderDay(o) === today && o.status !== 'Cancelada' && !o.annulled,
  )
  const todayDone = todayOrders.filter(
    (o) => o.status === 'Completada' || o.status === 'Abonado',
  )
  const coverage =
    todayOrders.length === 0
      ? 0
      : Math.round((todayDone.length / todayOrders.length) * 100)

  return [
    {
      title: 'Operaciones Activas',
      value: String(active.length),
      trend: `${orders.filter((o) => o.status === 'En Curso').length} en curso`,
      trendDirection: active.length > 0 ? 'up' : 'down',
      icon: Radio,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
    },
    {
      title: 'Operaciones Completadas',
      value: String(completed.length),
      trend: `${completed.filter((o) => orderDay(o) === today).length} hoy`,
      trendDirection: 'up',
      icon: Truck,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
    },
    {
      title: 'En Espera / Retrasadas',
      value: String(waitingOrDelayed.length),
      trend:
        waitingOrDelayed.length > 0
          ? 'Requieren seguimiento'
          : 'Sin pendientes críticos',
      trendDirection: waitingOrDelayed.length > 0 ? 'down' : 'up',
      icon: Timer,
      iconBg: 'bg-violet-50',
      iconColor: 'text-violet-600',
    },
    {
      title: 'Cobertura del Día',
      value: `${coverage}%`,
      trend:
        todayOrders.length === 0
          ? 'Sin OT programadas hoy'
          : `${todayDone.length}/${todayOrders.length} cerradas hoy`,
      trendDirection: coverage >= 50 ? 'up' : 'down',
      icon: MapPin,
      iconBg: 'bg-teal-50',
      iconColor: 'text-teal-600',
    },
  ]
}
