import { useEffect, useMemo, useState } from 'react'
import { Plus, UserCheck } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { KpiCard } from '@/components/ui/KpiCard'
import { ToastContainerView } from '@/components/ui/ToastContainer'
import { Select } from '@/components/ui/Select'
import { useOrdersStore } from '@/store/useOrdersStore'
import { ordersKpis } from '@/data/mock/orders'
import { OrdersBoard } from '@/features/orders/components/OrdersBoard'
import { OrdersTable } from '@/features/orders/components/OrdersTable'
import { OrderFormModal } from '@/features/orders/components/OrderFormModal'
import { DeleteOrderModal } from '@/features/orders/components/DeleteOrderModal'
import { OrderDetailDrawer } from '@/features/orders/components/OrderDetailDrawer'
import { PriorityQueuePanel } from '@/features/orders/components/PriorityQueuePanel'
import { OperatorWorkloadPanel } from '@/features/orders/components/OperatorWorkloadPanel'
import { IncidentsPanel } from '@/features/orders/components/IncidentsPanel'
import { ThirdPartyMonthlyStats } from '@/features/orders/components/ThirdPartyPanel'
import { MyAssignedOrdersModal } from '@/features/orders/components/MyAssignedOrdersModal'
import { CancelOrderModal } from '@/features/orders/components/CancelOrderModal'
import { AnnulOrderModal } from '@/features/orders/components/AnnulOrderModal'
import { CompletedOrdersApprovalPanel } from '@/features/orders/components/CompletedOrdersApprovalPanel'
import { RescheduleOrderModal } from '@/features/orders/components/RescheduleOrderModal'
import { OrderModificationRequestModal } from '@/features/orders/components/OrderModificationRequestModal'
import { ModificationRequestsPanel } from '@/features/orders/components/ModificationRequestsPanel'
import { useSessionUser } from '@/features/auth/useSessionUser'
import { isFieldOperator } from '@/features/auth/roleAccess'
import {
  isAssignedToOrder,
  listAssignedOrders,
} from '@/features/orders/utils/canEditOrder'

export function OrdersPage() {
  const allOrders = useOrdersStore((s) => s.orders)
  const modalMode = useOrdersStore((s) => s.modalMode)
  const selectedOrder = useOrdersStore((s) => s.selectedOrder)
  const openCreateModal = useOrdersStore((s) => s.openCreateModal)
  const openViewModal = useOrdersStore((s) => s.openViewModal)
  const closeModal = useOrdersStore((s) => s.closeModal)
  const toasts = useOrdersStore((s) => s.toasts)
  const removeToast = useOrdersStore((s) => s.removeToast)
  const syncFromApi = useOrdersStore((s) => s.syncFromApi)
  const urgencyFilter = useOrdersStore((s) => s.urgencyFilter)
  const setUrgencyFilter = useOrdersStore((s) => s.setUrgencyFilter)
  const addToast = useOrdersStore((s) => s.addToast)
  const currentUser = useSessionUser()
  const isOperator = isFieldOperator(currentUser)

  const [assignedModalOpen, setAssignedModalOpen] = useState(false)

  useEffect(() => {
    void syncFromApi()
  }, [syncFromApi])

  const visibleOrders = useMemo(() => {
    if (isOperator) return listAssignedOrders(allOrders, currentUser)
    return allOrders
  }, [allOrders, isOperator, currentUser])

  useEffect(() => {
    if (!isOperator || !selectedOrder) return
    if (!isAssignedToOrder(currentUser, selectedOrder)) {
      addToast(
        `No puedes ver la orden ${selectedOrder.id}: no está asignada a ti.`,
        'error',
      )
      closeModal()
    }
  }, [isOperator, selectedOrder, currentUser, addToast, closeModal])

  const kpis = ordersKpis(isOperator ? visibleOrders : allOrders)

  // ---------- Vista OPERADOR / TÉCNICO ----------
  if (isOperator) {
    return (
      <>
        <div className="space-y-6">
          <PageHeader
            title="Mis órdenes"
            subtitle={`Kanban y cola solo con OT asignadas a ${currentUser.name}.`}
            action={
              <Button
                leftIcon={<UserCheck className="h-4 w-4" />}
                onClick={() => setAssignedModalOpen(true)}
              >
                Mis asignadas
              </Button>
            }
          />

          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
            Sesión: <strong>{currentUser.name}</strong> ({currentUser.role}).
            Órdenes asignadas: <strong>{visibleOrders.length}</strong>
          </div>

          <PriorityQueuePanel ordersOverride={visibleOrders} />
          <OrdersBoard ordersOverride={visibleOrders} />
        </div>

        <MyAssignedOrdersModal
          open={assignedModalOpen}
          onClose={() => setAssignedModalOpen(false)}
          orders={visibleOrders}
          technicianName={currentUser.name ?? 'Técnico'}
          onSelect={(order) => openViewModal(order)}
        />

        <OrderFormModal
          mode="edit"
          order={selectedOrder}
          open={modalMode === 'edit'}
          onClose={closeModal}
        />
        <OrderDetailDrawer
          order={selectedOrder}
          open={modalMode === 'view'}
          onClose={closeModal}
        />
        <RescheduleOrderModal
          order={selectedOrder}
          open={modalMode === 'reschedule'}
          onClose={closeModal}
        />
        <OrderModificationRequestModal
          order={selectedOrder}
          open={modalMode === 'modRequest'}
          onClose={closeModal}
        />
        <DeleteOrderModal
          order={selectedOrder}
          open={modalMode === 'delete'}
          onClose={closeModal}
        />
        <ToastContainerView toasts={toasts} onRemove={removeToast} />
      </>
    )
  }

  // ---------- Vista ADMINISTRADOR (sin cambios de estructura) ----------
  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="Órdenes de Trabajo"
          subtitle="Administra y da seguimiento a todas las órdenes de trabajo."
          action={
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={urgencyFilter}
                onChange={(e) =>
                  setUrgencyFilter(e.target.value as 'all' | 'urgent')
                }
                className="w-auto min-w-[160px]"
                aria-label="Filtro de urgencia"
              >
                <option value="all">Todas las prioridades</option>
                <option value="urgent">Solo urgentes / altas</option>
              </Select>
              <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreateModal}>
                Nueva Orden
              </Button>
            </div>
          }
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {kpis.map((kpi) => (
            <KpiCard key={kpi.title} data={kpi} />
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <PriorityQueuePanel />
          <OperatorWorkloadPanel />
          <ThirdPartyMonthlyStats orders={allOrders} />
        </div>

        <OrdersBoard />
        <CompletedOrdersApprovalPanel />
        <ModificationRequestsPanel />
        <OrdersTable />
        <IncidentsPanel />
      </div>

      <OrderFormModal mode="create" open={modalMode === 'create'} onClose={closeModal} />
      <OrderFormModal mode="edit" order={selectedOrder} open={modalMode === 'edit'} onClose={closeModal} />
      <OrderDetailDrawer order={selectedOrder} open={modalMode === 'view'} onClose={closeModal} />
      <DeleteOrderModal order={selectedOrder} open={modalMode === 'delete'} onClose={closeModal} />
        <CancelOrderModal order={selectedOrder} open={modalMode === 'cancel'} onClose={closeModal} />
        <AnnulOrderModal order={selectedOrder} open={modalMode === 'annul'} onClose={closeModal} />
        <RescheduleOrderModal
          order={selectedOrder}
          open={modalMode === 'reschedule'}
          onClose={closeModal}
        />
        <OrderModificationRequestModal
          order={selectedOrder}
          open={modalMode === 'modRequest'}
          onClose={closeModal}
        />
        <ToastContainerView toasts={toasts} onRemove={removeToast} />
    </>
  )
}
