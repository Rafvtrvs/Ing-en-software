import { useEffect, useMemo, useState } from 'react'
import { Calendar, ClipboardList, Plus } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { KpiCard } from '@/components/ui/KpiCard'
import { ToastContainerView } from '@/components/ui/ToastContainer'
import { useOperationsStore } from '@/store/useOperationsStore'
import { formatDate } from '@/utils/formatters'
import { OperationsMap } from './components/OperationsMap'
import { FieldAlerts } from './components/FieldAlerts'
import { DaySchedule } from './components/DaySchedule'
import { FieldOrdersTable } from './components/FieldOrdersTable'
import { OperatorAvailabilityPanel } from './components/OperatorAvailabilityPanel'
import { OperatorAssignmentsPanel } from './components/OperatorAssignmentsPanel'
import { FieldOrderRegisterModal } from './components/FieldOrderRegisterModal'
import { AssignOperationModal } from './components/AssignOperationModal'
import { OfflineSyncPanel } from './components/OfflineSyncPanel'
import { OrderDetailDrawer } from '@/features/orders/components/OrderDetailDrawer'
import { useOrdersStore } from '@/store/useOrdersStore'
import { useUsersStore } from '@/store/useUsersStore'
import { getOperationsKpisFromData } from '@/features/operations/utils/operationsKpis'
import { useSessionUser } from '@/features/auth/useSessionUser'
import { isFieldOperator } from '@/features/auth/roleAccess'
import { listAssignedOrders } from '@/features/orders/utils/canEditOrder'

export function OperationsPage() {
  const [fieldRegisterOpen, setFieldRegisterOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)
  const toasts = useOperationsStore((s) => s.toasts)
  const removeToast = useOperationsStore((s) => s.removeToast)
  const allOrders = useOrdersStore((s) => s.orders)
  const modalMode = useOrdersStore((s) => s.modalMode)
  const selectedOrder = useOrdersStore((s) => s.selectedOrder)
  const closeModal = useOrdersStore((s) => s.closeModal)
  const syncOrders = useOrdersStore((s) => s.syncFromApi)
  const users = useUsersStore((s) => s.users)
  const roles = useUsersStore((s) => s.roles)
  const syncUsers = useUsersStore((s) => s.syncFromApi)
  const currentUser = useSessionUser()
  const isOperator = isFieldOperator(currentUser)
  const orders = useMemo(
    () => (isOperator ? listAssignedOrders(allOrders, currentUser) : allOrders),
    [allOrders, isOperator, currentUser],
  )
  const kpis = useMemo(
    () => getOperationsKpisFromData(orders, users, roles),
    [orders, users, roles],
  )
  const today = formatDate(new Date())

  useEffect(() => {
    void syncUsers()
    void syncOrders()
  }, [syncUsers, syncOrders])

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title={isOperator ? 'Mis operaciones' : 'Operaciones en Terreno'}
          subtitle={
            isOperator
              ? `Solo órdenes asignadas a ${currentUser.name}.`
              : 'Monitorea y gestiona las operaciones y técnicos en terreno en tiempo real.'
          }
          action={
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm">
                <Calendar className="h-4 w-4 text-slate-400" />
                {today}
              </div>
              {!isOperator && (
                <Button
                  variant="outline"
                  leftIcon={<Plus className="h-4 w-4" />}
                  onClick={() => setAssignOpen(true)}
                >
                  Asignar Operación
                </Button>
              )}
              <Button
                leftIcon={<ClipboardList className="h-4 w-4" />}
                onClick={() => setFieldRegisterOpen(true)}
              >
                Registrar orden de trabajo
              </Button>
            </div>
          }
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[repeat(auto-fit,minmax(240px,1fr))]">
          {kpis.map((kpi) => (
            <KpiCard key={kpi.title} data={kpi} />
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <OperationsMap
              title={isOperator ? 'Mapa de trabajo' : undefined}
              ordersOverride={orders}
            />
          </div>
          <FieldAlerts />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <DaySchedule ordersOverride={orders} />
          <div className="lg:col-span-2">
            <FieldOrdersTable ordersOverride={orders} />
          </div>
        </div>

        {!isOperator && (
          <div className="space-y-6">
            <OperatorAvailabilityPanel />
            <OperatorAssignmentsPanel />
          </div>
        )}

        <OfflineSyncPanel />
      </div>

      <FieldOrderRegisterModal
        open={fieldRegisterOpen}
        onClose={() => setFieldRegisterOpen(false)}
      />

      {!isOperator && (
        <AssignOperationModal
          open={assignOpen}
          onClose={() => setAssignOpen(false)}
        />
      )}

      <OrderDetailDrawer
        order={selectedOrder}
        open={modalMode === 'view'}
        onClose={closeModal}
      />

      <ToastContainerView toasts={toasts} onRemove={removeToast} />
    </>
  )
}
