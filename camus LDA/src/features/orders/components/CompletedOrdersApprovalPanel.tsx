import { useMemo, useState } from 'react'
import { CheckCircle } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { useOrdersStore } from '@/store/useOrdersStore'
import { formatDisplayDate } from '@/features/orders/utils/orderDates'
import type { WorkOrder } from '@/types'

const PAGE_SIZE = 5

/**
 * RF63 — CDS 216: Panel de órdenes completadas pendientes de aprobación
 */
export function CompletedOrdersApprovalPanel() {
  const orders = useOrdersStore((s) => s.orders)
  const openViewModal = useOrdersStore((s) => s.openViewModal)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const completedOrders = useMemo(
    () => orders.filter((o) => o.status === 'Completada'),
    [orders],
  )

  const visibleOrders = completedOrders.slice(0, visibleCount)
  const hasMore = visibleCount < completedOrders.length
  const canCollapse = visibleCount > PAGE_SIZE

  const pendingApproval = completedOrders.filter((o) => !o.approval).length
  const approved = completedOrders.filter((o) => o.approval).length

  const columns: Column<WorkOrder>[] = [
    { key: 'id', header: 'OT', render: (r) => <span className="font-medium">{r.id}</span> },
    { key: 'client', header: 'Cliente' },
    {
      key: 'endDate',
      header: 'Finalizada',
      render: (r) => (
        <span className="text-slate-600">
          {r.endDate ? formatDisplayDate(r.endDate) : r.createdAt}
        </span>
      ),
    },
    {
      key: 'approval',
      header: 'Aprobación',
      render: (r) =>
        r.approval ? (
          <Badge label="Aprobada" className="bg-emerald-50 text-emerald-700 ring-emerald-600/20" />
        ) : (
          <Badge label="Pendiente" className="bg-amber-50 text-amber-700 ring-amber-600/20" />
        ),
    },
    {
      key: 'actions',
      header: '',
      render: (r) => (
        <button
          type="button"
          onClick={() => openViewModal(r)}
          className="text-sm font-medium text-primary hover:underline"
        >
          Revisar
        </button>
      ),
    },
  ]

  return (
    <Card>
      <CardHeader
        title="Órdenes Finalizadas"
        subtitle="Filtra por estado Completada para aprobación formal."
        action={
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <CheckCircle className="h-4 w-4 text-emerald-500" />
            {approved} aprobadas · {pendingApproval} pendientes
          </div>
        }
      />

      {completedOrders.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">
          No hay órdenes con estado Completada.
        </p>
      ) : (
        <>
          <DataTable
            columns={columns}
            data={visibleOrders}
            keyExtractor={(r) => r.id}
            onRowClick={(r) => openViewModal(r)}
          />
          {(hasMore || canCollapse) && (
            <div className="mt-3 flex justify-center border-t border-slate-100 pt-3">
              {hasMore ? (
                <button
                  type="button"
                  onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Ver más
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setVisibleCount(PAGE_SIZE)}
                  className="text-sm font-medium text-slate-500 hover:text-slate-700 hover:underline"
                >
                  Ver menos
                </button>
              )}
            </div>
          )}
        </>
      )}
    </Card>
  )
}
