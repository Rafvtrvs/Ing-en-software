import { Card, CardHeader } from '@/components/ui/Card'
import { ChartLegend } from '@/components/ui/ChartLegend'
import { DonutChart } from '@/components/ui/DonutChart'
import { isConsumableStockCategory } from '@/features/inventory/utils/stockCategories'
import { computeStockStatus } from '@/features/inventory/utils/inventoryStatus'
import { useInventoryStore } from '@/store/useInventoryStore'
import { useMemo } from 'react'
import type { Product } from '@/types'

const COLORS = {
  Ok: '#22c55e',
  Bajo: '#f59e0b',
  Crítico: '#ef4444',
} as const

function productTooltipLabel(p: Product): string {
  return `${p.name} (${p.currentStock} ${p.unit})`
}

export function InventorySummaryChart() {
  const products = useInventoryStore((s) => s.products)

  const { chartData, totalProducts } = useMemo(() => {
    const tracked = products
      .filter((p) => isConsumableStockCategory(p.category))
      .map((p) => ({
        ...p,
        status: computeStockStatus(p.currentStock, p.minStock, p.category),
      }))

    const ok = tracked.filter((p) => p.status === 'Ok')
    const bajo = tracked.filter((p) => p.status === 'Bajo')
    const critico = tracked.filter((p) => p.status === 'Crítico')

    return {
      totalProducts: tracked.length,
      chartData: [
        {
          name: 'Óptimo',
          value: ok.length,
          color: COLORS.Ok,
          items: ok.map(productTooltipLabel),
        },
        {
          name: 'Bajo',
          value: bajo.length,
          color: COLORS.Bajo,
          items: bajo.map(productTooltipLabel),
        },
        {
          name: 'Crítico',
          value: critico.length,
          color: COLORS.Crítico,
          items: critico.map(productTooltipLabel),
        },
      ].filter((d) => d.value > 0),
    }
  }, [products])

  return (
    <Card>
      <CardHeader title="Resumen de Inventario" />
      {totalProducts === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">Sin datos</p>
      ) : (
        <div className="flex flex-col items-center gap-6">
          <DonutChart
            data={chartData}
            centerValue={totalProducts.toLocaleString('es-CL')}
            centerLabel="Productos"
          />
          <ChartLegend
            items={chartData.map((item) => ({
              name: item.name,
              value: item.value,
              color: item.color,
            }))}
            total={totalProducts}
          />
        </div>
      )}
    </Card>
  )
}
