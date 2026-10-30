import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardHeader } from '@/components/ui/Card'
import { ChartLegend } from '@/components/ui/ChartLegend'
import { DonutChart } from '@/components/ui/DonutChart'
import type { WorkOrder } from '@/types'
import { ROUTES } from '@/constants/routes'
import { buildOrdersByStatus } from '../utils/dashboardHelpers'

interface OrdersByStatusChartProps {
  orders: WorkOrder[]
}

export function OrdersByStatusChart({ orders }: OrdersByStatusChartProps) {
  const data = buildOrdersByStatus(orders)
  const total = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <Card>
      <CardHeader title="Órdenes de Trabajo por Estado" />
      {total === 0 ? (
        <p className="py-10 text-center text-sm text-slate-500">
          Sin órdenes para el filtro actual
        </p>
      ) : (
        <div className="flex flex-col items-center gap-6">
          <DonutChart
            size="sm"
            data={data}
            centerValue={total.toLocaleString('es-CL')}
            centerLabel="Total"
          />
          <ChartLegend
            className="w-full"
            items={data.map((item) => ({
              name: item.name,
              value: item.value,
              color: item.color ?? '#94a3b8',
            }))}
            total={total}
          />
        </div>
      )}
      <Link
        to={ROUTES.ORDENES}
        className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
      >
        Ver todas las órdenes
        <ArrowRight className="h-4 w-4" />
      </Link>
    </Card>
  )
}
