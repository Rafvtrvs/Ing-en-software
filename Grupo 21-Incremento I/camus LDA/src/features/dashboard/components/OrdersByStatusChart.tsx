import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import { Card, CardHeader } from '@/components/ui/Card'
import { ChartLegend } from '@/components/ui/ChartLegend'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { ordersByStatus } from '@/data/mock/dashboard'
import { ROUTES } from '@/constants/routes'

const total = ordersByStatus.reduce((sum, item) => sum + item.value, 0)

export function OrdersByStatusChart() {
  return (
    <Card>
      <CardHeader title="Órdenes de Trabajo por Estado" />
      <div className="flex flex-col items-center gap-8 md:flex-row md:items-center md:justify-between">
        <div className="relative h-52 w-52 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={ordersByStatus}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
              >
                {ordersByStatus.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-slate-900">{total}</span>
            <span className="text-xs text-slate-500">Total</span>
          </div>
        </div>
        <ChartLegend
          className="md:min-w-[220px] md:flex-1 md:max-w-[260px]"
          items={ordersByStatus.map((item) => ({
            name: item.name,
            value: item.value,
            color: item.color ?? '#94a3b8',
          }))}
          total={total}
        />
      </div>
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
