import { Card, CardHeader } from '@/components/ui/Card'
import { ChartLegend } from '@/components/ui/ChartLegend'
import { DonutChart } from '@/components/ui/DonutChart'
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
            <DonutChart
              data={chartData}
              centerValue={totalUnits.toLocaleString('es-CL')}
              centerLabel="Unidades"
            />
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
