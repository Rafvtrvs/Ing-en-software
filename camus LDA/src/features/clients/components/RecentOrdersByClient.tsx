import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Badge } from '@/components/ui/Badge'
import type { ClientOrder } from '@/types'
import { ROUTES } from '@/constants/routes'
import { UserAvatar } from '@/components/layout/UserAvatar'
import { useOrdersStore } from '@/store/useOrdersStore'
import { getRecentOrdersByClient } from '@/features/clients/utils/clientOrdersFromStore'

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
        <UserAvatar size="sm" />
        <span>{row.technician}</span>
      </div>
    ),
  },
]

export function RecentOrdersByClient() {
  const orders = useOrdersStore((s) => s.orders)
  const syncFromApi = useOrdersStore((s) => s.syncFromApi)

  useEffect(() => {
    void syncFromApi()
  }, [syncFromApi])

  const rows = useMemo(() => getRecentOrdersByClient(orders), [orders])

  return (
    <Card>
      <CardHeader title="Últimas Órdenes por Cliente" />
      {rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500">
          No hay órdenes registradas.
        </p>
      ) : (
        <DataTable columns={columns} data={rows} keyExtractor={(r) => r.id} />
      )}
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
