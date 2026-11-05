import { useMemo } from 'react'
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
import { getMostUsedProducts } from '@/features/reports/utils/reportStats'
import { useInventoryStore } from '@/store/useInventoryStore'
import { useOrdersStore } from '@/store/useOrdersStore'

export function MostUsedProductsChart() {
  const products = useInventoryStore((s) => s.products)
  const orders = useOrdersStore((s) => s.orders)

  const data = useMemo(() => {
    return getMostUsedProducts(orders, products).map((p) => ({
      name: p.name.length > 18 ? `${p.name.slice(0, 18)}…` : p.name,
      fullName: p.name,
      value: p.value,
      label: `${p.value} ${p.unit}`,
    }))
  }, [orders, products])

  return (
    <Card>
      <CardHeader title="Productos Más Utilizados" />
      {data.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-500">
          Sin uso registrado (0). Se actualizará al registrar insumos en las OT.
        </p>
      ) : (
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
            >
              <CartesianGrid {...chartGrid} horizontal={false} />
              <XAxis type="number" tick={chartTick} axisLine={false} tickLine={false} />
              <YAxis
                type="category"
                dataKey="name"
                width={108}
                tick={chartTick}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(value, _name, props) => [
                  (props.payload as { label: string }).label,
                  'Uso',
                ]}
                labelFormatter={(_, payload) => {
                  const row = payload?.[0]?.payload as { fullName?: string } | undefined
                  return row?.fullName ?? ''
                }}
                {...chartTooltip}
              />
              <Bar
                dataKey="value"
                name="Uso"
                fill="var(--color-primary)"
                radius={[0, 8, 8, 0]}
                barSize={12}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  )
}
