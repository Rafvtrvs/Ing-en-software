import { useCallback, useEffect, useMemo, useState } from 'react'
import { CloudOff, RefreshCw, Wifi, WifiOff } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { useOperationsStore } from '@/store/useOperationsStore'
import { useOrdersStore } from '@/store/useOrdersStore'
import {
  flushQueue,
  getFieldSyncEntries,
  loadQueue,
  subscribeFieldQueue,
} from '@/features/field/utils/fieldQueue'
import type { OfflineSyncEntry } from '@/types'
import { formatDateTime } from '@/utils/formatters'

/** RF46 — CU-155 / CU-156 / CU-157 — cola real de terreno (OT / estados / fotos / notas) */
export function OfflineSyncPanel() {
  const addToast = useOperationsStore((s) => s.addToast)
  const lastAutoSyncAt = useOperationsStore((s) => s.lastAutoSyncAt)
  const setLastSync = useOperationsStore((s) => s.setLastAutoSyncAt)
  const syncOrders = useOrdersStore((s) => s.syncFromApi)

  const [online, setOnline] = useState(
    typeof navigator === 'undefined' ? true : navigator.onLine,
  )
  const [entries, setEntries] = useState<OfflineSyncEntry[]>(() => getFieldSyncEntries())
  const [busy, setBusy] = useState(false)

  const refresh = useCallback(() => {
    setEntries(getFieldSyncEntries())
  }, [])

  const handleSync = useCallback(async () => {
    if (busy) return
    if (!navigator.onLine) {
      addToast('Sin conexión: no se puede sincronizar ahora', 'error')
      return
    }
    setBusy(true)
    try {
      const res = await flushQueue()
      setLastSync(new Date().toISOString())
      refresh()
      if (res.synced > 0) {
        addToast(`${res.synced} registro(s) de terreno sincronizado(s)`)
        await syncOrders()
      }
      if (res.failed.length > 0) {
        addToast(`No se pudo sincronizar: ${res.failed[0].message}`, 'error')
      }
      if (res.offline) {
        addToast('Conexión inestable: quedaron pendientes en el dispositivo', 'info')
      }
      if (res.synced === 0 && res.failed.length === 0 && !res.offline) {
        addToast('No hay registros pendientes de sincronización', 'info')
      }
    } finally {
      setBusy(false)
      refresh()
    }
  }, [busy, addToast, setLastSync, refresh, syncOrders])

  useEffect(() => {
    refresh()
    return subscribeFieldQueue(refresh)
  }, [refresh])

  useEffect(() => {
    const onOnline = () => {
      setOnline(true)
      if (loadQueue().length > 0) void handleSync()
    }
    const onOffline = () => setOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [handleSync])

  const stats = useMemo(() => {
    const pending = entries.filter((e) => e.status === 'pendiente').length
    const synced = entries.filter((e) => e.status === 'sincronizado').length
    const errors = entries.filter((e) => e.status === 'error').length
    return { pending, synced, errors }
  }, [entries])

  const columns: Column<OfflineSyncEntry>[] = [
    { key: 'module', header: 'Módulo' },
    { key: 'summary', header: 'Resumen', className: 'max-w-[280px]' },
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
        subtitle="Cola real de terreno: OT, cambios de estado, intervenciones y evidencias"
        action={
          <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
            {online ? (
              <>
                <Wifi className="h-4 w-4 text-emerald-600" aria-hidden />
                En línea
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-amber-600" aria-hidden />
                Sin conexión
              </>
            )}
          </div>
        }
      />

      {!online && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <CloudOff className="mt-0.5 h-4 w-4 shrink-0" />
          No hay conexión a internet. Los registros de terreno se guardan en este dispositivo.
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Button
          leftIcon={<RefreshCw className="h-4 w-4" />}
          onClick={() => void handleSync()}
          disabled={busy}
        >
          {busy ? 'Sincronizando…' : 'Sincronizar pendientes'}
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

      {entries.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">
          No hay registros de terreno en cola. Los cambios offline (OT, estados, fotos,
          notas) aparecerán aquí.
        </p>
      ) : (
        <DataTable columns={columns} data={entries} keyExtractor={(r) => r.id} />
      )}
    </Card>
  )
}
