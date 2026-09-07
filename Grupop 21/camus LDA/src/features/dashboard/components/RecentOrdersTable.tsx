import { Card, CardHeader } from '@/components/ui/Card'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Badge } from '@/components/ui/Badge'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { recentOrders } from '@/data/mock/dashboard'
import type { WorkOrder } from '@/types'
import { ROUTES } from '@/constants/routes'

const columns: Column<WorkOrder>[] = [
  { key: 'id', header: 'ID Orden', className: 'font-medium text-slate-900' },
  { key: 'client', header: 'Cliente' },
  { key: 'address', header: 'Dirección' },
  { key: 'category', header: 'Categoría' },
  {
    key: 'status',
    header: 'Estado',
    render: (row) => <Badge label={row.status} />,
  },
  { key: 'createdAt', header: 'Fecha Creación' },
]

export function RecentOrdersTable() {
  return (
    <Card className="lg:col-span-2">
      <CardHeader title="Últimas Órdenes de Trabajo" />
      <DataTable columns={columns} data={recentOrders} keyExtractor={(r) => r.id} />
      <Link
        to={ROUTES.ORDENES}
        className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
      >
        Ver todas las órdenes
        <ArrowRight className="h-4 w-4" />
      </Link>
    </Card>
  )
}
