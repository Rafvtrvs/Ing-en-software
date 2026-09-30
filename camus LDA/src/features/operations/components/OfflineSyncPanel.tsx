import { useMemo } from 'react'
import { CloudOff, RefreshCw, Wifi, WifiOff } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Switch } from '@/components/ui/Switch'
import { useOperationsStore } from '@/store/useOperationsStore'
import type { OfflineSyncEntry } from '@/types'
import { formatDateTime } from '@/utils/formatters'

/** RF46 — CU-155 / CU-156 / CU-157 */
export function OfflineSyncPanel() {
  const offlineMode = useOperationsStore((s) => s.offlineMode)
  const syncEntries = useOperationsStore((s) => s.syncEntries)
  const lastAutoSyncAt = useOperationsStore((s) => s.lastAutoSyncAt)
  const setOfflineMode = useOperationsStore((s) => s.setOfflineMode)
  const syncPendingEntries = useOperationsStore((s) => s.syncPendingEntries)

  const stats = useMemo(() => {
    const pending = syncEntries.filter((e) => e.status === 'pendiente').length
    const synced = syncEntries.filter((e) => e.status === 'sincronizado').length
    const errors = syncEntries.filter((e) => e.status === 'error').length
    return { pending, synced, errors }
  }, [syncEntries])

  const columns: Column<OfflineSyncEntry>[] = [
    { key: 'module', header: 'Módulo' },
    { key: 'summary', header: 'Resumen', className: 'max-w-[240px]' },
    {
      key: 'status',
      header: 'Estado',
      render: (row) => {
        const label =
          row.status === 'pendiente'
            ? 'Pendiente'
            : row.status === 'sincronizado'
              ? 'Actualizado'
              : 'Error'
        const cls =
          row.status === 'pendiente'
            ? 'bg-amber-50 text-amber-700 ring-amber-600/20'
            : row.status === 'sincronizado'
              ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
              : 'bg-red-50 text-red-700 ring-red-600/20'
        return <Badge label={label} className={cls} />
      },
    },
    {
      key: 'createdAt',
      header: 'Fecha',
      render: (row) => (
        <span className="text-sm text-slate-600">{formatDateTime(row.createdAt)}</span>
      ),
    },
  ]

  return (
    <Card>
      <CardHeader
        title="Registro sin conexión y sincronización"
        subtitle="CU-155: guardado local · CU-156: sincronización · CU-157: estado de registros"
        action={
          <div className="flex items-center gap-2">
            {offlineMode ? (
              <WifiOff className="h-4 w-4 text-amber-600" aria-hidden />
            ) : (
              <Wifi className="h-4 w-4 text-emerald-600" aria-hidden />
            )}
            <Switch
              checked={offlineMode}
              onChange={setOfflineMode}
              id="offline-mode-switch"
            />
            <span className="text-xs text-slate-600">Sin conexión</span>
          </div>
        }
      />

      {offlineMode && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <CloudOff className="mt-0.5 h-4 w-4 shrink-0" />
          No hay conexión a internet. La información ingresada se almacenará temporalmente en el dispositivo.
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Button leftIcon={<RefreshCw className="h-4 w-4" />} onClick={() => syncPendingEntries()}>
          Sincronizar automáticamente
        </Button>
        {lastAutoSyncAt && (
          <p className="text-xs text-slate-500">
            Última sincronización: {formatDateTime(lastAutoSyncAt)}
          </p>
        )}
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
          <span className="text-slate-500">Pendientes</span>
          <p className="font-semibold text-slate-900">{stats.pending}</p>
        </div>
        <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
          <span className="text-slate-500">Sincronizados</span>
          <p className="font-semibold text-slate-900">{stats.synced}</p>
        </div>
        <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
          <span className="text-slate-500">Con error</span>
          <p className="font-semibold text-slate-900">{stats.errors}</p>
        </div>
      </div>

      {syncEntries.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">No hay registros para mostrar.</p>
      ) : (
        <DataTable columns={columns} data={syncEntries} keyExtractor={(r) => r.id} />
      )}
    </Card>
  )
}
