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
import { mostUsedProducts } from '@/data/mock/inventory'

export function MostUsedProductsChart() {
  const data = mostUsedProducts.map((p) => ({
    name: p.name.length > 18 ? `${p.name.slice(0, 18)}…` : p.name,
    fullName: p.name,
    value: p.value,
    label: `${p.value} ${p.unit}`,
  }))

  return (
    <Card>
      <CardHeader
        title="Productos Más Utilizados"
        action={
          <select className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600">
            <option>Este mes</option>
            <option>Últimos 3 meses</option>
          </select>
        }
      />
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <YAxis
              type="category"
              dataKey="name"
              width={100}
              tick={{ fontSize: 10, fill: '#64748b' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(value, _name, props) => [
                `${value} (${(props.payload as { label: string }).label})`,
                'Uso',
              ]}
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                fontSize: '12px',
              }}
            />
            <Bar dataKey="value" fill="#2563eb" radius={[0, 4, 4, 0]} barSize={14} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
