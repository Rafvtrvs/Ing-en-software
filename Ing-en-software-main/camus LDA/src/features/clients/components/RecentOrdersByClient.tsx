import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Badge } from '@/components/ui/Badge'
import { recentOrdersByClient } from '@/data/mock/clients'
import type { ClientOrder } from '@/types'
import { ROUTES } from '@/constants/routes'

const columns: Column<ClientOrder>[] = [
  { key: 'id', header: 'ID Orden', className: 'font-medium text-slate-900' },
  { key: 'client', header: 'Cliente' },
  { key: 'service', header: 'Servicio' },
  {
    key: 'status',
    header: 'Estado',
    render: (row) => <Badge label={row.status} />,
  },
  { key: 'date', header: 'Fecha' },
  {
    key: 'technician',
    header: 'Técnico Asignado',
    render: (row) => (
      <div className="flex items-center gap-2">
        <img
          src={row.technicianAvatar}
          alt={row.technician}
          className="h-7 w-7 rounded-full bg-slate-100 object-cover"
        />
        <span>{row.technician}</span>
      </div>
    ),
  },
]

export function RecentOrdersByClient() {
  return (
    <Card>
      <CardHeader title="Últimas Órdenes por Cliente" />
      <DataTable
        columns={columns}
        data={recentOrdersByClient}
        keyExtractor={(r) => r.id}
      />
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
