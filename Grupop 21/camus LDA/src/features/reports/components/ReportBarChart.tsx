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
import type { ChartDataPoint } from '@/types'

interface ReportBarChartProps {
  title: string
  data: ChartDataPoint[]
  color?: string
  layout?: 'vertical' | 'horizontal'
}

export function ReportBarChart({
  title,
  data,
  color = '#2563eb',
  layout = 'vertical',
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
              margin={{ top: 0, right: 20, left: isVertical ? 0 : -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={!isVertical} />
              {isVertical ? (
                <>
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={110}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                  />
                </>
              ) : (
                <>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                </>
              )}
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="value" fill={color} radius={isVertical ? [0, 4, 4, 0] : [4, 4, 0, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  )
}
