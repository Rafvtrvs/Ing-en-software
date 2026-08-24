import { Link } from 'react-router-dom'
import { Card, CardHeader } from '@/components/ui/Card'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Badge } from '@/components/ui/Badge'
import { fieldActiveOrders } from '@/data/mock/operations'
import type { FieldActiveOrder } from '@/types'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/utils/cn'

const columns: Column<FieldActiveOrder>[] = [
  { key: 'id', header: 'ID Orden', className: 'font-medium text-slate-900' },
  { key: 'client', header: 'Cliente' },
  { key: 'service', header: 'Servicio' },
  { key: 'technician', header: 'Técnico' },
  {
    key: 'status',
    header: 'Estado',
    render: (row) => <Badge label={row.status} context="field" />,
  },
  {
    key: 'progress',
    header: 'Progreso',
    render: (row) => (
      <div className="flex min-w-[100px] items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${row.progress}%` }}
          />
        </div>
        <span className={cn('text-xs font-semibold tabular-nums')}>{row.progress}%</span>
      </div>
    ),
  },
]

export function FieldOrdersTable() {
  return (
    <Card>
      <CardHeader
        title="Órdenes en Ejecución"
        action={
          <Link to={ROUTES.ORDENES} className="text-xs font-medium text-primary hover:underline">
            Ver todas
          </Link>
        }
      />
      <DataTable
        columns={columns}
        data={fieldActiveOrders}
        keyExtractor={(r) => r.id}
      />
    </Card>
  )
}
