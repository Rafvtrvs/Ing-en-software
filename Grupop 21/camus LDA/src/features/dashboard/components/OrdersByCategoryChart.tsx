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
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { ordersByCategory } from '@/data/mock/dashboard'
import { ROUTES } from '@/constants/routes'

export function OrdersByCategoryChart() {
  return (
    <Card>
      <CardHeader title="Órdenes por Categoría de Falla" />
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={ordersByCategory}
            layout="vertical"
            margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <YAxis
              type="category"
              dataKey="name"
              width={110}
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
            />
            <Bar dataKey="value" fill="#2563eb" radius={[0, 4, 4, 0]} barSize={16} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <Link
        to={ROUTES.REPORTES}
        className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
      >
        Ver reporte completo
        <ArrowRight className="h-4 w-4" />
      </Link>
    </Card>
  )
}
