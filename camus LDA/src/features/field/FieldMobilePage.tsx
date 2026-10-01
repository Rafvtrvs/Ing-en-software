import { useCallback, useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { CloudOff, LogOut, RefreshCw, Wifi } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { authService } from '@/services/authService'
import { useOrdersStore } from '@/store/useOrdersStore'
import { useSessionUser } from '@/features/auth/useSessionUser'
import { isFieldOperator } from '@/features/auth/roleAccess'
import { listAssignedOrders } from '@/features/orders/utils/canEditOrder'
import { FieldOrderView } from '@/features/field/components/FieldOrderView'
import {
  enqueue,
  flushQueue,
  loadQueue,
  type NewFieldAction,
} from '@/features/field/utils/fieldQueue'
import { ROUTES } from '@/constants/routes'

/**
 * RF35 — Vista móvil de terreno para operadores (instalable como app, ver manifest).
 * CU-115 acceso y panel · CU-116 ubicación · CU-117 avance · CU-118 foto · CU-119 sincronizar
 */
export function FieldMobilePage() {
  const user = useSessionUser()
  const orders = useOrdersStore((s) => s.orders)
  const syncFromApi = useOrdersStore((s) => s.syncFromApi)

  const [online, setOnline] = useState(navigator.onLine)
  const [pending, setPending] = useState(() => loadQueue().length)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)

  // CU-115 paso 4: validar identidad y rol. Los roles de oficina usan la app de escritorio.
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

  /** CU-117/118: guardar en el dispositivo y enviar de inmediato si hay conexión. */
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
    return action.kind === 'photo' ? 'Evidencia vinculada a la orden con éxito.' : 'Registro enviado correctamente.'
  }

  return (
    <div className="mx-auto min-h-screen max-w-md bg-surface">
      <header className="sticky top-0 z-10 flex items-center justify-between bg-primary px-4 py-3 text-white">
        <div>
          <p className="text-sm font-semibold">Camus · Terreno</p>
          <p className="text-xs text-blue-100">{user.name}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1 text-xs">
            {online ? <Wifi className="h-4 w-4" /> : <CloudOff className="h-4 w-4" />}
            {online ? 'En línea' : 'Sin conexión'}
          </span>
          <button
            type="button"
            aria-label="Cerrar sesión"
            onClick={() => {
              authService.logout()
              window.location.assign('/login')
            }}
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      <main className="space-y-4 p-4">
        <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
          <span className="text-sm text-slate-700">
            Pendientes de envío: <strong>{pending}</strong>
          </span>
          <Button
            size="sm"
            leftIcon={<RefreshCw className={syncing ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />}
            disabled={syncing || !online}
            onClick={() => void sync()}
          >
            Sincronizar
          </Button>
        </div>
        {syncMessage && (
          <p role="status" className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700">
            {syncMessage}
          </p>
        )}

        {selected ? (
          <FieldOrderView order={selected} onBack={() => setSelectedId(null)} onAction={handleAction} />
        ) : (
          <section className="space-y-2">
            <h1 className="text-base font-semibold text-slate-900">Mis órdenes ({assigned.length})</h1>
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
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">{o.status}</span>
                </div>
                <p className="font-medium text-slate-900">{o.client}</p>
                <p className="text-sm text-slate-600">{o.address}</p>
              </button>
            ))}
          </section>
        )}
      </main>
    </div>
  )
}
