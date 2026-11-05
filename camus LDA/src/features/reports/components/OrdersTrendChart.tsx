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
import { chartGrid, chartTick, chartTooltip } from '@/components/ui/chartTheme'

export function OrdersTrendChart({
  data,
}: {
  data: { month: string; orders: number }[]
}) {
  const hasData = data.some((d) => d.orders > 0)

  return (
    <Card>
      <CardHeader title="Evolución de Órdenes" />
      {!hasData ? (
        <p className="py-10 text-center text-sm text-slate-500">
          Sin órdenes registradas en el período.
        </p>
      ) : (
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="ordersTrendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid {...chartGrid} />
              <XAxis dataKey="month" tick={chartTick} axisLine={false} tickLine={false} />
              <YAxis tick={chartTick} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip {...chartTooltip} />
              <Area
                type="monotone"
                dataKey="orders"
                name="Órdenes"
                stroke="var(--color-primary)"
                strokeWidth={2.5}
                fill="url(#ordersTrendFill)"
                dot={{ fill: 'var(--color-primary)', r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  )
}
