import { useCallback, useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import {
  CloudOff,
  Columns3,
  ListOrdered,
  LogOut,
  MapPinned,
  PlusCircle,
  RefreshCw,
  UserCheck,
  Wifi,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ToastContainerView } from '@/components/ui/ToastContainer'
import { NotificationsPanel } from '@/components/layout/NotificationsPanel'
import { authService } from '@/services/authService'
import { useOrdersStore } from '@/store/useOrdersStore'
import { useSessionUser } from '@/features/auth/useSessionUser'
import { isFieldOperator } from '@/features/auth/roleAccess'
import { listAssignedOrders } from '@/features/orders/utils/canEditOrder'
import { FieldOrderView } from '@/features/field/components/FieldOrderView'

/** Ancho lógico iPhone 16 (CSS px) — layout de terreno sin marco visual */
const IPHONE_16_WIDTH = 393
import { PriorityQueuePanel } from '@/features/orders/components/PriorityQueuePanel'
import { OrdersBoard } from '@/features/orders/components/OrdersBoard'
import { MyAssignedOrdersModal } from '@/features/orders/components/MyAssignedOrdersModal'
import { FieldOrderPanel } from '@/features/orders/components/FieldOrderPanel'
import { OrderDetailDrawer } from '@/features/orders/components/OrderDetailDrawer'
import { OrderFormModal } from '@/features/orders/components/OrderFormModal'
import { DeleteOrderModal } from '@/features/orders/components/DeleteOrderModal'
import { RescheduleOrderModal } from '@/features/orders/components/RescheduleOrderModal'
import { OrderModificationRequestModal } from '@/features/orders/components/OrderModificationRequestModal'
import {
  enqueue,
  flushQueue,
  loadQueue,
  type NewFieldAction,
} from '@/features/field/utils/fieldQueue'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/utils/cn'

type MobileTab = 'terreno' | 'cola' | 'kanban' | 'nueva'

/**
 * Vista móvil de terreno (RF-35) + funciones de operador de la vista PC:
 * cola, kanban, mis asignadas, registro OT, detalle y sync offline.
 */
export function FieldMobilePage() {
  const user = useSessionUser()
  const orders = useOrdersStore((s) => s.orders)
  const syncFromApi = useOrdersStore((s) => s.syncFromApi)
  const modalMode = useOrdersStore((s) => s.modalMode)
  const selectedOrder = useOrdersStore((s) => s.selectedOrder)
  const openViewModal = useOrdersStore((s) => s.openViewModal)
  const closeModal = useOrdersStore((s) => s.closeModal)
  const toasts = useOrdersStore((s) => s.toasts)
  const removeToast = useOrdersStore((s) => s.removeToast)

  const [online, setOnline] = useState(navigator.onLine)
  const [pending, setPending] = useState(() => loadQueue().length)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [tab, setTab] = useState<MobileTab>('terreno')
  const [assignedModalOpen, setAssignedModalOpen] = useState(false)

  const allowed = isFieldOperator(user)
  const assigned = useMemo(() => listAssignedOrders(orders, user), [orders, user])
  const selected = assigned.find((o) => o.id === selectedId) ?? null

  const sync = useCallback(async () => {
    setSyncing(true)
    try {
      const res = await flushQueue()
      setPending(loadQueue().length)
      if (res.offline) {
        setSyncMessage('Sin conexión con el servidor. Los datos quedan pendientes.')
      } else if (res.failed.length > 0) {
        setSyncMessage(
          `Sincronizado: ${res.synced}. Rechazados: ${res.failed.length} (${res.failed[0].message})`,
        )
      } else if (res.synced > 0) {
        setSyncMessage(`Sincronización exitosa: ${res.synced} registro(s) enviado(s).`)
      } else {
        setSyncMessage('No hay datos pendientes de envío.')
      }
      if (!res.offline) await syncFromApi()
    } finally {
      setSyncing(false)
    }
  }, [syncFromApi])

  useEffect(() => {
    if (!allowed) return
    void syncFromApi()
    const goOnline = () => {
      setOnline(true)
      if (loadQueue().length > 0) void sync()
    }
    const goOffline = () => setOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [allowed, sync, syncFromApi])

  if (!allowed) return <Navigate to={ROUTES.DASHBOARD} replace />

  const handleAction = async (action: NewFieldAction): Promise<string> => {
    const saved = enqueue(action)
    if (!saved.ok) return 'Memoria del dispositivo llena. Sincroniza y vuelve a intentar.'
    setPending(loadQueue().length)
    if (!navigator.onLine) return 'Guardado en el dispositivo. Se enviará al sincronizar.'
    const res = await flushQueue()
    setPending(loadQueue().length)
    if (res.offline) return 'Guardado en el dispositivo. Se enviará al sincronizar.'
    if (res.failed.length > 0) return `No se pudo registrar: ${res.failed[0].message}`
    await syncFromApi()
    return action.kind === 'photo'
      ? 'Evidencia vinculada a la orden con éxito.'
      : 'Registro enviado correctamente.'
  }

  const tabs: { id: MobileTab; label: string; icon: typeof MapPinned }[] = [
    { id: 'terreno', label: 'Terreno', icon: MapPinned },
    { id: 'cola', label: 'Cola', icon: ListOrdered },
    { id: 'kanban', label: 'Kanban', icon: Columns3 },
    { id: 'nueva', label: 'Nueva OT', icon: PlusCircle },
  ]

  return (
    <>
    <div
      className="mx-auto flex min-h-dvh w-full flex-col bg-surface"
      style={{ maxWidth: IPHONE_16_WIDTH }}
    >
      <header className="sticky top-0 z-20 bg-primary px-3 py-3 text-white">
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold leading-tight">Camus · Terreno</p>
            <p className="truncate text-xs text-blue-100">
              {user.name} · {assigned.length} asignada(s)
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-0.5">
            <span
              className="mr-0.5 inline-flex h-9 items-center gap-1 rounded-lg bg-white/10 px-2 text-[11px] font-medium text-blue-50"
              title={online ? 'En línea' : 'Sin conexión'}
            >
              {online ? <Wifi className="h-3.5 w-3.5 shrink-0" /> : <CloudOff className="h-3.5 w-3.5 shrink-0" />}
              <span className="max-w-[4.5rem] truncate">
                {online ? 'En línea' : 'Offline'}
              </span>
            </span>

            <NotificationsPanel variant="onPrimary" />

            <button
              type="button"
              aria-label="Cerrar sesión"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-white hover:bg-white/15"
              onClick={() => {
                authService.logout()
                window.location.assign('/login')
              }}
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-4 gap-1 rounded-lg bg-white/10 p-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setTab(t.id)
                setSelectedId(null)
              }}
              className={cn(
                'flex flex-col items-center gap-0.5 rounded-md px-1 py-1.5 text-[10px] font-medium',
                tab === t.id ? 'bg-white text-primary' : 'text-blue-100',
              )}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <main className="space-y-4 p-4 pb-8">
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
          <span className="text-sm text-slate-700">
            Pendientes de envío: <strong>{pending}</strong>
          </span>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              leftIcon={<UserCheck className="h-4 w-4" />}
              onClick={() => setAssignedModalOpen(true)}
            >
              Mis asignadas
            </Button>
            <Button
              size="sm"
              leftIcon={
                <RefreshCw className={syncing ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
              }
              disabled={syncing || !online}
              onClick={() => void sync()}
            >
              Sincronizar
            </Button>
          </div>
        </div>

        {syncMessage && (
          <p role="status" className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700">
            {syncMessage}
          </p>
        )}

        {tab === 'terreno' &&
          (selected ? (
            <FieldOrderView
              order={selected}
              onBack={() => setSelectedId(null)}
              onAction={handleAction}
            />
          ) : (
            <section className="space-y-2">
              <h1 className="text-base font-semibold text-slate-900">
                Mis órdenes ({assigned.length})
              </h1>
              {assigned.length === 0 && (
                <p className="text-sm text-slate-500">No tienes órdenes asignadas.</p>
              )}
              {assigned.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setSelectedId(o.id)}
                  className="w-full rounded-xl border border-slate-100 bg-white p-4 text-left shadow-sm active:bg-slate-50"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">{o.id}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">
                      {o.status}
                    </span>
                  </div>
                  <p className="font-medium text-slate-900">{o.client}</p>
                  <p className="text-sm text-slate-600">{o.address}</p>
                </button>
              ))}
            </section>
          ))}

        {tab === 'cola' && (
          <div className="space-y-2">
            <h2 className="text-base font-semibold text-slate-900">Cola de atención</h2>
            <p className="text-xs text-slate-500">
              Solo órdenes asignadas a ti (misma lógica que en la vista PC).
            </p>
            <PriorityQueuePanel ordersOverride={assigned} />
          </div>
        )}

        {tab === 'kanban' && (
          <div className="space-y-2">
            <h2 className="text-base font-semibold text-slate-900">Kanban</h2>
            <p className="text-xs text-slate-500">
              Desliza horizontalmente para ver todas las columnas.
            </p>
            <div className="-mx-4 overflow-x-auto px-4 pb-2">
              <OrdersBoard ordersOverride={assigned} horizontalScroll />
            </div>
          </div>
        )}

        {tab === 'nueva' && (
          <div className="space-y-2">
            <h2 className="text-base font-semibold text-slate-900">
              Registrar OT en terreno
            </h2>
            <FieldOrderPanel />
          </div>
        )}
      </main>
      <ToastContainerView toasts={toasts} onRemove={removeToast} />
    </div>

      <MyAssignedOrdersModal
        open={assignedModalOpen}
        onClose={() => setAssignedModalOpen(false)}
        orders={assigned}
        technicianName={user.name ?? 'Técnico'}
        onSelect={(order) => {
          openViewModal(order)
          setSelectedId(order.id)
          setTab('terreno')
        }}
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
    </>
  )
}
