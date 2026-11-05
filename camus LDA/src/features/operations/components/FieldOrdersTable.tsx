import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardHeader } from '@/components/ui/Card'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Badge } from '@/components/ui/Badge'
import { useOrdersStore } from '@/store/useOrdersStore'
import type { WorkOrder } from '@/types'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/utils/cn'

const columns: Column<WorkOrder>[] = [
  { key: 'id', header: 'ID Orden', className: 'font-medium text-slate-900' },
  { key: 'client', header: 'Cliente' },
  {
    key: 'service',
    header: 'Servicio',
    render: (row) => row.service || row.category || '—',
  },
  {
    key: 'technician',
    header: 'Técnico',
    render: (row) =>
      row.technician ||
      row.operators?.map((o) => o.name).join(', ') ||
      'Sin asignar',
  },
  {
    key: 'status',
    header: 'Estado',
    render: (row) => <Badge label={row.status} context="order" />,
  },
  {
    key: 'progress',
    header: 'Progreso',
    render: (row) => {
      const progress = row.progress ?? 0
      return (
        <div className="flex min-w-[100px] items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className={cn('text-xs font-semibold tabular-nums')}>{progress}%</span>
        </div>
      )
    },
  },
]

/** Órdenes en ejecución = estado En Curso desde la API / store del sistema. */
export function FieldOrdersTable({
  ordersOverride,
}: {
  ordersOverride?: WorkOrder[]
}) {
  const storeOrders = useOrdersStore((s) => s.orders)
  const orders = ordersOverride ?? storeOrders
  const syncFromApi = useOrdersStore((s) => s.syncFromApi)
  const openViewModal = useOrdersStore((s) => s.openViewModal)

  useEffect(() => {
    void syncFromApi()
  }, [syncFromApi])

  const inProgress = useMemo(
    () =>
      orders
        .filter((o) => o.status === 'En Curso')
        .sort((a, b) => b.id.localeCompare(a.id, 'es', { numeric: true })),
    [orders],
  )

  return (
    <Card>
      <CardHeader
        title="Órdenes en Ejecución"
        subtitle={
          inProgress.length === 0
            ? 'Sin OT en curso en el sistema'
            : `${inProgress.length} orden(es) con estado En Curso`
        }
        action={
          <Link to={ROUTES.ORDENES} className="text-xs font-medium text-primary hover:underline">
            Ver todas
          </Link>
        }
      />
      {inProgress.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500">
          No hay órdenes en ejecución. Las OT con estado <strong>En Curso</strong> aparecerán
          aquí automáticamente.
        </p>
      ) : (
        <DataTable
          columns={columns}
          data={inProgress}
          keyExtractor={(r) => r.id}
          onRowClick={(row) => openViewModal(row)}
        />
      )}
    </Card>
  )
}
