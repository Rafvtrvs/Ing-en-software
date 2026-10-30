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
import { chartGrid, chartTick, chartTooltip } from '@/components/ui/chartTheme'
import type { ChartDataPoint } from '@/types'

interface ReportBarChartProps {
  title: string
  data: ChartDataPoint[]
  color?: string
  layout?: 'vertical' | 'horizontal'
  valueLabel?: string
}

export function ReportBarChart({
  title,
  data,
  color = 'var(--color-primary)',
  layout = 'vertical',
  valueLabel = 'Cantidad',
}: ReportBarChartProps) {
  const isVertical = layout === 'vertical'

  return (
    <Card>
      <CardHeader title={title} />
      {data.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-500">Sin datos para mostrar</p>
      ) : (
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout={isVertical ? 'vertical' : 'horizontal'}
              margin={{ top: 8, right: 16, left: 0, bottom: isVertical ? 0 : 4 }}
            >
              <CartesianGrid {...chartGrid} horizontal={!isVertical} />
              {isVertical ? (
                <XAxis type="number" tick={chartTick} axisLine={false} tickLine={false} />
              ) : (
                <XAxis
                  dataKey="name"
                  type="category"
                  interval={0}
                  tick={chartTick}
                  axisLine={false}
                  tickLine={false}
                  height={36}
                />
              )}
              {isVertical ? (
                <YAxis
                  type="category"
                  dataKey="name"
                  width={120}
                  tick={chartTick}
                  axisLine={false}
                  tickLine={false}
                />
              ) : (
                <YAxis tick={chartTick} axisLine={false} tickLine={false} allowDecimals={false} />
              )}
              <Tooltip
                {...chartTooltip}
                cursor={{ fill: 'rgb(15 23 42 / 0.04)' }}
                formatter={(value) => [value, valueLabel]}
                labelFormatter={(_, payload) => {
                  const row = payload?.[0]?.payload as { name?: string } | undefined
                  return row?.name ?? ''
                }}
              />
              <Bar
                dataKey="value"
                name={valueLabel}
                fill={color}
                radius={isVertical ? [0, 8, 8, 0] : [8, 8, 0, 0]}
                barSize={14}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  )
}
