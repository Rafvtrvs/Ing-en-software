import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import { Card, CardHeader } from '@/components/ui/Card'
import { ChartLegend } from '@/components/ui/ChartLegend'
import { useInventoryStore } from '@/store/useInventoryStore'
import { useMemo } from 'react'

const COLORS = {
  Ok: '#22c55e',
  Bajo: '#f59e0b',
  Crítico: '#ef4444',
}

export function InventorySummaryChart() {
  const products = useInventoryStore((s) => s.products)

  const { chartData, totalUnits } = useMemo(() => {
    const ok = products.filter((p) => p.status === 'Ok')
    const bajo = products.filter((p) => p.status === 'Bajo')
    const critico = products.filter((p) => p.status === 'Crítico')
    const totalUnits = products.reduce((s, p) => s + p.currentStock, 0)

    return {
      totalUnits,
      chartData: [
        {
          name: 'Óptimo',
          value: ok.reduce((s, p) => s + p.currentStock, 0),
          color: COLORS.Ok,
        },
        {
          name: 'Bajo',
          value: bajo.reduce((s, p) => s + p.currentStock, 0),
          color: COLORS.Bajo,
        },
        {
          name: 'Crítico',
          value: critico.reduce((s, p) => s + p.currentStock, 0),
          color: COLORS.Crítico,
        },
      ].filter((d) => d.value > 0),
    }
  }, [products])

  return (
    <Card>
      <CardHeader title="Resumen de Inventario" />
      {products.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">Sin datos</p>
      ) : (
        <>
          <div className="flex flex-col items-center gap-6">
            <div className="relative h-48 w-48">
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
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold text-slate-900">
                  {totalUnits.toLocaleString('es-CL')}
                </span>
                <span className="text-xs text-slate-500">Unidades</span>
              </div>
            </div>
            <ChartLegend
              items={chartData.map((item) => ({
                name: item.name,
                value: item.value,
                color: item.color,
              }))}
              total={totalUnits}
            />
          </div>
        </>
      )}
    </Card>
  )
}
