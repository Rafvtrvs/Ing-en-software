import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import { BarChart3, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardHeader } from '@/components/ui/Card'
import { ChartLegend } from '@/components/ui/ChartLegend'
import { useClientsStore } from '@/store/useClientsStore'
import { getClientsByStatus } from '@/features/clients/utils/clientStats'
import { ROUTES } from '@/constants/routes'

export function ClientsSummaryChart() {
  const clients = useClientsStore((s) => s.clients)
  const chartData = getClientsByStatus(clients)
  const total = clients.length

  return (
    <Card>
      <CardHeader title="Resumen de Clientes" />
      {total === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">Sin datos de clientes</p>
      ) : (
        <>
          <div className="flex flex-col items-center gap-6">
            <div className="relative h-48 w-48 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={78}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
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
              items={chartData.map((item) => ({
                name: item.name,
                value: item.value,
                color: item.color ?? '#94a3b8',
              }))}
              total={total}
            />
          </div>
          <Link
            to={ROUTES.REPORTES}
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <BarChart3 className="h-4 w-4" />
            Ver reporte completo
            <ArrowRight className="h-4 w-4" />
          </Link>
        </>
      )}
    </Card>
  )
}
