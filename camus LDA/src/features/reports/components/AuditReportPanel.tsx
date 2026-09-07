import { useEffect, useMemo, useState } from 'react'
import { Download, Eye, Filter, Search, Shield } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Drawer } from '@/components/ui/Drawer'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { KpiCard } from '@/components/ui/KpiCard'
import { reportsService } from '@/services/reportsService'
import type { AuditLogEntry } from '@/data/mock/audit'
import { AuditLogDetailPanel } from '@/features/reports/components/AuditLogDetailPanel'
import { useReportsStore } from '@/store/useReportsStore'
import { formatDateTime } from '@/utils/formatters'

const MODULES = [
  'Todos',
  'Autenticación',
  'Seguridad',
  'Clientes',
  'Órdenes',
  'Inventario',
  'Facturación',
  'Usuarios',
  'Configuración',
] as const

const MODULE_ALIASES: Record<string, string[]> = {
  Autenticación: ['auth', 'autenticación', 'autenticacion', 'seguridad'],
  Seguridad: ['auth', 'autenticación', 'autenticacion', 'seguridad'],
  Clientes: ['clientes'],
  Órdenes: ['órdenes', 'ordenes'],
  Inventario: ['inventario'],
  Facturación: ['facturación', 'facturacion'],
  Usuarios: ['usuarios'],
  Configuración: ['configuración', 'configuracion'],
}

function matchesModuleFilter(modulo: string, filter: string): boolean {
  if (filter === 'Todos') return true
  const aliases = MODULE_ALIASES[filter] ?? [filter.toLowerCase()]
  const normalized = modulo.trim().toLowerCase()
  return aliases.some((alias) => alias.toLowerCase() === normalized)
}

function isSecurityFilter(filter: string): boolean {
  return filter === 'Autenticación' || filter === 'Seguridad'
}

function exportAuditLogsCsv(logs: AuditLogEntry[]) {
  const headers = [
    'Fecha y hora',
    'Módulo',
    'Acción',
    'Usuario',
    'Valor anterior',
    'Valor nuevo',
    'Ubicación',
  ]
  const rows = logs.map((log) => [
    log.fechaHora,
    log.moduloAfectado,
    log.accion,
    log.usuario,
    log.valorAnterior ?? '',
    log.valorNuevo ?? '',
    log.ubicacion,
  ])
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `bitacora-auditoria_${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

export function AuditReportPanel() {
  const addToast = useReportsStore((s) => s.addToast)
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [moduleFilter, setModuleFilter] = useState<string>('Todos')
  const [showFilters, setShowFilters] = useState(true)
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null)

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

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return logs.filter((log) => {
      const matchesModule = matchesModuleFilter(log.moduloAfectado, moduleFilter)
      const matchesSearch =
        !q ||
        log.accion.toLowerCase().includes(q) ||
        log.moduloAfectado.toLowerCase().includes(q) ||
        log.usuario.toLowerCase().includes(q) ||
        (log.valorNuevo?.toLowerCase().includes(q) ?? false)
      return matchesModule && matchesSearch
    })
  }, [logs, search, moduleFilter])

  useEffect(() => {
    if (selectedLog && !filtered.some((log) => log.id === selectedLog.id)) {
      setSelectedLog(null)
    }
  }, [filtered, selectedLog])

  const openDetail = (log: AuditLogEntry) => setSelectedLog(log)

  const handleExport = () => {
    exportAuditLogsCsv(filtered)
    addToast('Bitácora exportada a CSV correctamente', 'success')
  }

  const todayCount = logs.filter((l) =>
    l.fechaHora.startsWith(new Date().toISOString().slice(0, 10)),
  ).length

  const bitacoraTitle = isSecurityFilter(moduleFilter)
    ? 'Bitácora de seguridad'
    : 'Bitácora de auditoría'

  const bitacoraSubtitle = isSecurityFilter(moduleFilter)
    ? 'Registro de inicios de sesión y eventos de autenticación.'
    : 'Haz clic en un registro para ver fecha, hora, ubicación y responsable.'

  const kpis = [
    {
      title: 'Registros totales',
      value: String(logs.length),
      trend: 'Últimos 100 eventos',
      trendDirection: 'up' as const,
      icon: Shield,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Eventos hoy',
      value: String(todayCount || logs.slice(0, 3).length),
      trend: 'Actividad reciente',
      trendDirection: 'up' as const,
      icon: Shield,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
    },
    {
      title: 'Módulos activos',
      value: String(new Set(logs.map((l) => l.moduloAfectado)).size),
      trend: 'Con movimientos registrados',
      trendDirection: 'up' as const,
      icon: Shield,
      iconBg: 'bg-violet-50',
      iconColor: 'text-violet-600',
    },
    {
      title: 'Resultados filtrados',
      value: String(filtered.length),
      trend: 'Según criterios actuales',
      trendDirection: 'down' as const,
      icon: Shield,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
    },
  ]

  const columns: Column<AuditLogEntry>[] = [
    {
      key: 'fechaHora',
      header: 'Fecha y hora',
      render: (row) => (
        <span className="whitespace-nowrap text-sm text-slate-700">
          {formatDateTime(row.fechaHora)}
        </span>
      ),
    },
    {
      key: 'moduloAfectado',
      header: 'Módulo',
      render: (row) => <Badge label={row.moduloAfectado} />,
    },
    { key: 'accion', header: 'Acción' },
    { key: 'usuario', header: 'Usuario' },
    {
      key: 'valorAnterior',
      header: 'Valor anterior',
      render: (row) => (
        <span className="max-w-[140px] truncate text-sm text-slate-500">
          {row.valorAnterior ?? '—'}
        </span>
      ),
    },
    {
      key: 'valorNuevo',
      header: 'Valor nuevo',
      render: (row) => (
        <span className="max-w-[160px] truncate text-sm font-medium text-slate-800">
          {row.valorNuevo ?? '—'}
        </span>
      ),
    },
    {
      key: 'detalle',
      header: '',
      className: 'w-28 text-right',
      render: (row) => (
        <Button
          type="button"
          variant="outline"
          size="sm"
          leftIcon={<Eye className="h-3.5 w-3.5" />}
          onClick={(e) => {
            e.stopPropagation()
            openDetail(row)
          }}
        >
          Ver
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.title} data={kpi} />
        ))}
      </div>

      <Card>
        <CardHeader
          title={bitacoraTitle}
          subtitle={bitacoraSubtitle}
          action={
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Download className="h-4 w-4" />}
                onClick={handleExport}
                disabled={filtered.length === 0}
              >
                Exportar a Excel/CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Filter className="h-4 w-4" />}
                onClick={() => setShowFilters((v) => !v)}
              >
                Filtros
              </Button>
            </div>
          }
        />

        {showFilters && (
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-[200px] flex-1 max-w-md">
              <Input
                placeholder="Buscar por acción, módulo o usuario..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                icon={<Search className="h-4 w-4" />}
              />
            </div>
            <div className="min-w-[180px]">
              <label className="mb-1.5 block text-xs font-medium text-slate-600">
                Módulo
              </label>
              <Select
                value={moduleFilter}
                onChange={(e) => setModuleFilter(e.target.value)}
              >
                {MODULES.map((mod) => (
                  <option key={mod} value={mod}>
                    {mod === 'Autenticación' ? 'Autenticación (login)' : mod}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        )}

        {loading ? (
          <p className="py-10 text-center text-sm text-slate-500">
            Cargando bitácora...
          </p>
        ) : filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">
            No hay registros con los filtros seleccionados.
          </p>
        ) : (
          <DataTable
            columns={columns}
            data={filtered}
            keyExtractor={(row) => row.id}
            selectedKey={selectedLog?.id ?? null}
            onRowClick={openDetail}
          />
        )}
      </Card>

      <Drawer
        open={selectedLog !== null}
        onClose={() => setSelectedLog(null)}
        title="Detalle del registro"
        widthClassName="w-full max-w-md"
      >
        {selectedLog && <AuditLogDetailPanel log={selectedLog} />}
      </Drawer>
    </div>
  )
}
