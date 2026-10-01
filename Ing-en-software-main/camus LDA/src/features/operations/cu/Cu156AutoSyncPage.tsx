import { useNavigate } from 'react-router-dom'
import { RefreshCw } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { CuPageBanner } from '@/components/ui/CuPageBanner'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ToastContainerView } from '@/components/ui/ToastContainer'
import { ROUTES } from '@/constants/routes'
import { useOperationsStore } from '@/store/useOperationsStore'
import { formatDateTime } from '@/utils/formatters'

/** RF46 — CU-156: Sincronización automática de registros */
export function Cu156AutoSyncPage() {
  const navigate = useNavigate()
  const syncPendingEntries = useOperationsStore((s) => s.syncPendingEntries)
  const lastAutoSyncAt = useOperationsStore((s) => s.lastAutoSyncAt)
  const syncEntries = useOperationsStore((s) => s.syncEntries)
  const addToast = useOperationsStore((s) => s.addToast)
  const toasts = useOperationsStore((s) => s.toasts)
  const removeToast = useOperationsStore((s) => s.removeToast)

  const pending = syncEntries.filter((e) => e.status === 'pendiente').length

  const handleSync = () => {
    const { synced, failed } = syncPendingEntries()
    if (synced === 0 && failed === 0) {
      addToast('No hay registros pendientes por sincronizar', 'info')
      return
    }
    addToast(
      `Sincronización completada: ${synced} actualizado(s)${failed ? `, ${failed} con error` : ''}`,
    )
  }

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="Operaciones en Terreno"
          subtitle="Vista dedicada al caso de uso CU-156."
          action={
            <Button variant="outline" onClick={() => navigate(ROUTES.CU157)}>
              Ir a CU-157 — Estado de sync
            </Button>
          }
        />

        <CuPageBanner
          rf="RF46"
          rfTitle="Registro sin conexión y sincronización"
          cu="CU-156"
          cuTitle="Sincronizar automáticamente registros pendientes"
        />

        <Card className="p-6">
          <p className="mb-4 text-sm text-slate-600">
            Registros pendientes en cola local: <strong>{pending}</strong>
          </p>
          <Button leftIcon={<RefreshCw className="h-4 w-4" />} onClick={handleSync}>
            Ejecutar sincronización automática
          </Button>
          {lastAutoSyncAt && (
            <p className="mt-4 text-xs text-slate-500">
              Última sincronización: {formatDateTime(lastAutoSyncAt)}
            </p>
          )}
        </Card>
      </div>
      <ToastContainerView toasts={toasts} onRemove={removeToast} />
    </>
  )
}
