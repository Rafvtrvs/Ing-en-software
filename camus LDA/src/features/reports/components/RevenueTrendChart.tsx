import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, CardHeader } from '@/components/ui/Card'
import { revenueByMonth } from '@/data/mock/reports'
import { chartGrid, chartTick, chartTooltip } from '@/components/ui/chartTheme'
import { formatCurrency } from '@/utils/formatters'

export function RevenueTrendChart() {
  return (
    <Card>
      <CardHeader title="Ingresos por Mes" />
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={revenueByMonth} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.2} />
                <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid {...chartGrid} />
            <XAxis dataKey="month" tick={chartTick} axisLine={false} tickLine={false} />
            <YAxis
              tick={chartTick}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `$${(v / 1_000_000).toFixed(0)}M`}
            />
            <Tooltip
              formatter={(value: number) => [formatCurrency(value), 'Ingresos']}
              {...chartTooltip}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              name="Ingresos"
              stroke="var(--color-primary)"
              strokeWidth={2.5}
              fill="url(#revenueGradient)"
              dot={{ fill: 'var(--color-primary)', r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
