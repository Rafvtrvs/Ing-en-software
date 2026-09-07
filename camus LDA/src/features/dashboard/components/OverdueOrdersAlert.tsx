import { AlertTriangle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import type { WorkOrder } from '@/types'
import { ROUTES } from '@/constants/routes'
import {
  OVERDUE_DAYS_THRESHOLD,
  daysOverdue,
  getOverdueOrders,
} from '../utils/dashboardHelpers'

interface OverdueOrdersAlertProps {
  orders: WorkOrder[]
}

export function OverdueOrdersAlert({ orders }: OverdueOrdersAlertProps) {
  const overdue = getOverdueOrders(orders)

  return (
    <Card>
      <CardHeader
        title="Alertas de órdenes atrasadas"
        subtitle={`OT Pendiente o En Curso con más de ${OVERDUE_DAYS_THRESHOLD} días sin avance`}
        action={
          overdue.length > 0 ? (
            <Badge
              label={`${overdue.length} atrasada${overdue.length === 1 ? '' : 's'}`}
              className="bg-red-50 text-red-700"
            />
          ) : undefined
        }
      />
      {overdue.length === 0 ? (
        <p className="flex items-center gap-2 text-sm text-slate-500">
          <AlertTriangle className="h-4 w-4 text-emerald-500" />
          No hay órdenes atrasadas según el criterio actual.
        </p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {overdue.map((order) => (
            <li
              key={order.id}
              className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
            >
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {order.id} — {order.client}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {order.category} · {order.status} · Prioridad {order.priority ?? 'Media'} ·{' '}
                  {daysOverdue(order)} días
                </p>
              </div>
              <Badge
                label={`${daysOverdue(order)}d`}
                className="bg-red-50 text-red-700"
              />
            </li>
          ))}
        </ul>
      )}
      <Link to={ROUTES.ORDENES} className="mt-4 inline-block">
        <Button type="button" variant="outline" size="sm">
          Ir a órdenes
        </Button>
      </Link>
    </Card>
  )
}
