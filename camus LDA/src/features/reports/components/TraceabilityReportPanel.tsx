import { useEffect, useMemo, useState } from 'react'
import { Filter, Shield, Wand2 } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { KpiCard } from '@/components/ui/KpiCard'
import { Drawer } from '@/components/ui/Drawer'
import type { AuditLogEntry } from '@/data/mock/audit'
import { reportsService } from '@/services/reportsService'
import { useOrdersStore } from '@/store/useOrdersStore'
import { useUsersStore } from '@/store/useUsersStore'
import { getActiveFieldOperators } from '@/features/operations/utils/fieldTechnicians'
import { formatDateTime } from '@/utils/formatters'
import { AuditLogDetailPanel } from '@/features/reports/components/AuditLogDetailPanel'
import { ClientTraceabilitySection } from '@/features/reports/components/ClientTraceabilitySection'

type TraceabilityFilter = 'por_ot' | 'por_cliente'

function extractOrderIdFromText(text: string | null | undefined): string | null {
  if (!text) return null
  try {
    const parsed = JSON.parse(text) as Record<string, unknown>
    for (const key of ['orderId', 'idOt', 'id']) {
      const v = parsed?.[key]
      if (typeof v === 'string' && v.trim()) return v.trim()
    }
  } catch {
    // texto plano
  }
  const m = text.match(/\bOT-[A-Za-z0-9_-]+\b/i)
  return m?.[0] ?? null
}

function logMatchesOrder(log: AuditLogEntry, orderId: string): boolean {
  if (log.orderId && log.orderId === orderId) return true
  const fromNew = extractOrderIdFromText(log.valorNuevo)
  if (fromNew === orderId) return true
  const fromOld = extractOrderIdFromText(log.valorAnterior)
  if (fromOld === orderId) return true
  const needle = orderId.toLowerCase()
  return (
    (log.valorNuevo ?? '').toLowerCase().includes(needle) ||
    (log.valorAnterior ?? '').toLowerCase().includes(needle)
  )
}

function inRange(iso: string, from: string, to: string): boolean {
  const t = new Date(iso).getTime()
  const start = new Date(`${from}T00:00:00`).getTime()
  const end = new Date(`${to}T23:59:59`).getTime()
  if ([t, start, end].some((n) => Number.isNaN(n))) return false
  return t >= start && t <= end
}

export function TraceabilityReportPanel() {
  const orders = useOrdersStore((s) => s.orders)
  const syncOrders = useOrdersStore((s) => s.syncFromApi)
  const users = useUsersStore((s) => s.users)
  const roles = useUsersStore((s) => s.roles)
  const syncUsers = useUsersStore((s) => s.syncFromApi)

  const [reportFilter, setReportFilter] = useState<TraceabilityFilter>('por_ot')
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)

  const [showFilters, setShowFilters] = useState(true)
  const [orderId, setOrderId] = useState('')
  const [operarioId, setOperarioId] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const [executed, setExecuted] = useState(false)
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null)

  useEffect(() => {
    void syncUsers()
    void syncOrders()
  }, [syncUsers, syncOrders])

  useEffect(() => {
    let active = true
    setLoading(true)
    reportsService
      .fetchAuditLogs()
      .then((data) => {
        if (active) setLogs(data)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const today = new Date()
    const toDate = today.toISOString().slice(0, 10)
    const fromDate = new Date(today)
    fromDate.setDate(fromDate.getDate() - 90)
    if (!from) setFrom(fromDate.toISOString().slice(0, 10))
    if (!to) setTo(toDate)
    if (!orderId && orders.length > 0) setOrderId(orders[0].id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders])

  /** Solo operarios/técnicos activos del sistema (Postgres). */
  const operarios = useMemo(
    () => getActiveFieldOperators(users, roles),
    [users, roles],
  )

  useEffect(() => {
    if (!operarioId) return
    const stillValid = operarios.some((op) => op.id === operarioId)
    if (!stillValid) setOperarioId('')
  }, [operarios, operarioId])

  const timeline = useMemo(() => {
    if (!executed || !orderId || !from || !to) return []
    const selectedOp = operarios.find((op) => op.id === operarioId)

    return logs
      .filter((l) => {
        if (!logMatchesOrder(l, orderId)) return false
        if (!inRange(l.fechaHora, from, to)) return false
        if (!operarioId) return true
        if (l.idUsuario != null && String(l.idUsuario) === operarioId) return true
        if (
          selectedOp?.name &&
          l.usuario.toLowerCase() === selectedOp.name.toLowerCase()
        ) {
          return true
        }
        return false
      })
      .sort((a, b) => new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime())
  }, [executed, logs, orderId, operarioId, operarios, from, to])

  const selectedOrder = orders.find((o) => o.id === orderId) ?? null

  const kpis = [
    {
      title: 'Eventos trazados',
      value: String(timeline.length),
      trend: executed ? 'Resultado del reporte' : 'Aún no ejecutado',
      trendDirection: 'up' as const,
      icon: Shield,
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
    },
    {
      title: 'OT seleccionada',
      value: orderId || '—',
      trend: selectedOrder ? selectedOrder.client : '—',
      trendDirection: 'up' as const,
      icon: Shield,
      iconBg: 'bg-violet-50',
      iconColor: 'text-violet-600',
    },
  ]

  const canRun = Boolean(orderId && from && to)

  if (reportFilter === 'por_cliente') {
    return (
      <div className="space-y-6">
        <Card className="p-4">
          <label className="mb-1.5 block text-xs font-medium text-slate-600">
            Filtro de reporte
          </label>
          <Select
            value={reportFilter}
            onChange={(e) => setReportFilter(e.target.value as TraceabilityFilter)}
            className="max-w-xs"
          >
            <option value="por_ot">Por OT</option>
            <option value="por_cliente">Por Cliente</option>
          </Select>
        </Card>
        <ClientTraceabilitySection logs={logs} loading={loading} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <label className="mb-1.5 block text-xs font-medium text-slate-600">
          Filtro de reporte
        </label>
        <Select
          value={reportFilter}
          onChange={(e) => setReportFilter(e.target.value as TraceabilityFilter)}
          className="max-w-xs"
        >
          <option value="por_ot">Por OT</option>
          <option value="por_cliente">Por Cliente</option>
        </Select>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.title} data={kpi} />
        ))}
      </div>

      <Card>
        <CardHeader
          title="Reportes de Trazabilidad"
          subtitle="Historial real desde Postgres: estados Kanban, intervenciones, comentarios, evidencia y documentos."
          action={
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Filter className="h-4 w-4" />}
              onClick={() => setShowFilters((v) => !v)}
            >
              Filtros
            </Button>
          }
        />

        {showFilters && (
          <div className="mb-4 grid gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4 lg:grid-cols-6">
            <div className="lg:col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-slate-600">Orden de trabajo</label>
              <Select value={orderId} onChange={(e) => setOrderId(e.target.value)}>
                {orders.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.id} — {o.client}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600">Desde</label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600">Hasta</label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
            <div className="lg:col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-slate-600">Operario</label>
              <Select
                value={operarioId}
                onChange={(e) => setOperarioId(e.target.value)}
                disabled={operarios.length === 0}
              >
                <option value="">Todos</option>
                {operarios.map((op) => (
                  <option key={op.id} value={op.id}>
                    {op.name}
                  </option>
                ))}
              </Select>
              {operarios.length === 0 ? (
                <p className="mt-1 text-xs text-slate-500">
                  No hay operarios activos registrados en el sistema.
                </p>
              ) : null}
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-slate-600">
            {loading ? (
              <span>Cargando historial...</span>
            ) : executed ? (
              <span>
                Reporte generado para <span className="font-semibold text-slate-900">{orderId}</span> —{' '}
                <span className="text-slate-500">{timeline.length} eventos</span>
              </span>
            ) : (
              <span>Configura filtros y solicita la generación del reporte.</span>
            )}
          </div>
          <Button
            type="button"
            leftIcon={<Wand2 className="h-4 w-4" />}
            onClick={() => setExecuted(true)}
            disabled={!canRun || loading}
          >
            Generar reporte
          </Button>
        </div>

        {executed && (
          <div className="mt-4 space-y-3">
            {timeline.length === 0 ? (
              <p className="rounded-xl border border-slate-100 bg-white p-4 text-sm text-slate-500">
                No se encontraron eventos con los filtros seleccionados.
              </p>
            ) : (
              <ol className="space-y-3">
                {timeline.map((l) => (
                  <li
                    key={l.id}
                    className="rounded-xl border border-slate-100 bg-white p-4 hover:border-primary/20"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {l.moduloAfectado} — {l.accion}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {formatDateTime(l.fechaHora)} · {l.usuario} · {l.ubicacion}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedLog(l)}
                      >
                        Ver detalle
                      </Button>
                    </div>
                    <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                      <div>
                        <p className="text-xs text-slate-500">Valor anterior</p>
                        <p className="mt-0.5 break-words text-slate-700">{l.valorAnterior ?? '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Valor nuevo</p>
                        <p className="mt-0.5 break-words font-medium text-slate-900">{l.valorNuevo ?? '—'}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}
      </Card>

      <Drawer
        open={selectedLog !== null}
        onClose={() => setSelectedLog(null)}
        title="Detalle de evento"
        widthClassName="w-full max-w-md"
      >
        {selectedLog && <AuditLogDetailPanel log={selectedLog} />}
      </Drawer>
    </div>
  )
}
