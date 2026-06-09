import { useEffect } from 'react'
import { Plus } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { KpiCard } from '@/components/ui/KpiCard'
import { ToastContainerView } from '@/components/ui/ToastContainer'
import { useOrdersStore } from '@/store/useOrdersStore'
import { ordersKpis } from '@/data/mock/orders'
import { OrdersBoard } from '@/features/orders/components/OrdersBoard'
import { OrdersTable } from '@/features/orders/components/OrdersTable'
import { OrderFormModal } from '@/features/orders/components/OrderFormModal'
import { DeleteOrderModal } from '@/features/orders/components/DeleteOrderModal'
import { OrderDetailDrawer } from '@/features/orders/components/OrderDetailDrawer'

export function OrdersPage() {
  const orders = useOrdersStore((s) => s.orders)
  const modalMode = useOrdersStore((s) => s.modalMode)
  const selectedOrder = useOrdersStore((s) => s.selectedOrder)
  const openCreateModal = useOrdersStore((s) => s.openCreateModal)
  const closeModal = useOrdersStore((s) => s.closeModal)
  const toasts = useOrdersStore((s) => s.toasts)
  const removeToast = useOrdersStore((s) => s.removeToast)
  const syncFromApi = useOrdersStore((s) => s.syncFromApi)

  useEffect(() => {
    void syncFromApi()
  }, [syncFromApi])

  const kpis = ordersKpis(orders)

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="Órdenes de Trabajo"
          subtitle="Administra y da seguimiento a todas las órdenes de trabajo."
          action={
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreateModal}>
              Nueva Orden
            </Button>
          }
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {kpis.map((kpi) => (
            <KpiCard key={kpi.title} data={kpi} />
          ))}
        </div>

        <OrdersBoard />
        <OrdersTable />
      </div>

      <OrderFormModal mode="create" open={modalMode === 'create'} onClose={closeModal} />
      <OrderFormModal mode="edit" order={selectedOrder} open={modalMode === 'edit'} onClose={closeModal} />
      <OrderDetailDrawer order={selectedOrder} open={modalMode === 'view'} onClose={closeModal} />
      <DeleteOrderModal order={selectedOrder} open={modalMode === 'delete'} onClose={closeModal} />

      <ToastContainerView toasts={toasts} onRemove={removeToast} />
    </>
  )
}

