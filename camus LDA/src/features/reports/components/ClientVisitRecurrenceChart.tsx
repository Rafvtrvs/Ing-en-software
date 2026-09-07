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

interface ClientVisitRecurrenceChartProps {
  data: ChartDataPoint[]
  clientName?: string
}

export function ClientVisitRecurrenceChart({ data, clientName }: ClientVisitRecurrenceChartProps) {
  return (
    <Card>
      <CardHeader
        title="Recurrencia de visitas"
        subtitle={
          clientName
            ? `Servicios registrados por período para ${clientName}`
            : 'Frecuencia de servicios por mes'
        }
      />
      {data.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-500">
          Sin visitas registradas para generar el gráfico.
        </p>
      ) : (
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  fontSize: '12px',
                }}
                formatter={(value) => [`${value} visita(s)`, 'Servicios']}
              />
              <Bar dataKey="value" fill="#7c3aed" radius={[4, 4, 0, 0]} barSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  )
}
