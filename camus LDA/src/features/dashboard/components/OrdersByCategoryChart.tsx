import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, CardHeader } from '@/components/ui/Card'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { chartGrid, chartTick, chartTooltip } from '@/components/ui/chartTheme'
import type { WorkOrder } from '@/types'
import { ROUTES } from '@/constants/routes'
import { buildOrdersByCategory } from '../utils/dashboardHelpers'

interface OrdersByCategoryChartProps {
  orders: WorkOrder[]
}

export function OrdersByCategoryChart({ orders }: OrdersByCategoryChartProps) {
  const data = buildOrdersByCategory(orders)

  return (
    <Card>
      <CardHeader title="Órdenes por Categoría de Falla" />
      {data.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-500">
          Sin órdenes para el filtro actual
        </p>
      ) : (
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
            >
              <CartesianGrid {...chartGrid} horizontal={false} />
              <XAxis type="number" tick={chartTick} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="name"
                width={128}
                tick={chartTick}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip {...chartTooltip} />
              <Bar dataKey="value" name="Órdenes" fill="var(--color-primary)" radius={[0, 8, 8, 0]} barSize={14} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      <Link
        to={ROUTES.REPORTES}
        className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
      >
        Ver reporte completo
        <ArrowRight className="h-4 w-4" />
      </Link>
    </Card>
  )
}
