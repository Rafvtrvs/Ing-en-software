import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ExternalLink, Search, Wrench } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { KpiCard } from '@/components/ui/KpiCard'
import { Button } from '@/components/ui/Button'
import type { Equipment, EquipmentStatus } from '@/types'
import { formatShortDate } from '@/utils/formatters'
import { AlertTriangle, CheckCircle, Settings } from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { useOrdersStore } from '@/store/useOrdersStore'
import { useEquipmentStore } from '@/store/useEquipmentStore'
import { EquipmentActionsMenu } from '@/features/inventory/components/EquipmentActionsMenu'
import {
  EquipmentDeleteModal,
  EquipmentEditModal,
  EquipmentViewModal,
} from '@/features/inventory/components/EquipmentModals'
import { reportsService } from '@/services/reportsService'
import {
  mapAuditToEquipmentHistory,
  type EquipmentHistoryItem,
} from '@/features/inventory/utils/equipmentHistory'

const STATUS_OPTIONS: Array<EquipmentStatus | 'all'> = [
  'all',
  'Operativo',
  'Asignado',
  'Mantenimiento',
  'Fuera de servicio',
]

export function EquipmentPanel() {
  const navigate = useNavigate()
  const orders = useOrdersStore((s) => s.orders)
  const openViewModal = useOrdersStore((s) => s.openViewModal)
  const updateOrder = useOrdersStore((s) => s.updateOrder)
  const items = useEquipmentStore((s) => s.equipment)
  const syncEquipment = useEquipmentStore((s) => s.syncFromApi)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<EquipmentStatus | 'all'>('all')
  const [selected, setSelected] = useState<Equipment | null>(null)
  const [viewOpen, setViewOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [history, setHistory] = useState<EquipmentHistoryItem[]>([])

  const syncLocationsFromOrders = useEquipmentStore((s) => s.syncLocationsFromOrders)

  const loadHistory = useCallback(async () => {
    try {
      const logs = await reportsService.fetchAuditLogs()
      setHistory(mapAuditToEquipmentHistory(logs))
    } catch {
      setHistory([])
    }
  }, [])

  useEffect(() => {
    void (async () => {
      await syncEquipment()
      await syncLocationsFromOrders(useOrdersStore.getState().orders)
      await loadHistory()
    })()
  }, [syncEquipment, syncLocationsFromOrders, loadHistory])

  const maintenanceCalendar = useMemo(() => {
    return [...items].sort(
      (a, b) =>
        new Date(a.nextMaintenance).getTime() - new Date(b.nextMaintenance).getTime(),
    )
  }, [items])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return items.filter((eq) => {
      const matchesSearch =
        !q ||
        eq.name.toLowerCase().includes(q) ||
        eq.code.toLowerCase().includes(q) ||
        eq.serialNumber.toLowerCase().includes(q) ||
        eq.location.toLowerCase().includes(q) ||
        (eq.patente ?? '').toLowerCase().includes(q)
      const matchesStatus = statusFilter === 'all' || eq.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [items, search, statusFilter])

  const kpis = [
    {
      title: 'Equipos registrados',
      value: String(items.length),
      trend: 'Maquinaria y herramientas',
      trendDirection: 'up' as const,
      icon: Settings,
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
    },
    {
      title: 'Operativos',
      value: String(items.filter((e) => e.status === 'Operativo').length),
      trend: 'Disponibles para operación',
      trendDirection: 'up' as const,
      icon: CheckCircle,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
    },
    {
      title: 'En mantención',
      value: String(items.filter((e) => e.status === 'Mantenimiento').length),
      trend: 'Programados o en taller',
      trendDirection: 'down' as const,
      icon: Wrench,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
    },
    {
      title: 'Fuera de servicio',
      value: String(items.filter((e) => e.status === 'Fuera de servicio').length),
      trend: 'Requieren revisión',
      trendDirection: 'down' as const,
      icon: AlertTriangle,
      iconBg: 'bg-red-50',
      iconColor: 'text-red-600',
    },
  ]

  const openView = (row: Equipment) => {
    setSelected(row)
    setViewOpen(true)
  }

  const openEdit = (row: Equipment) => {
    setSelected(row)
    setEditOpen(true)
  }

  const openDelete = (row: Equipment) => {
    setSelected(row)
    setDeleteOpen(true)
  }

  const columns: Column<Equipment>[] = [
    {
      key: 'code',
      header: 'Código',
      render: (row) => <span className="font-medium text-slate-900">{row.code}</span>,
    },
    { key: 'name', header: 'Equipo' },
    { key: 'serialNumber', header: 'N° serie' },
    { key: 'category', header: 'Categoría' },
    { key: 'location', header: 'Ubicación' },
    {
      key: 'status',
      header: 'Estado',
      render: (row) => (
        <Badge
          label={row.status}
          className={
            row.status === 'Operativo'
              ? 'bg-emerald-50 text-emerald-700'
              : row.status === 'Asignado'
                ? 'bg-blue-50 text-blue-700'
                : row.status === 'Mantenimiento'
                  ? 'bg-amber-50 text-amber-700'
                  : 'bg-red-50 text-red-700'
          }
        />
      ),
    },
    {
      key: 'nextMaintenance',
      header: 'Próx. mantención',
      render: (row) => formatShortDate(row.nextMaintenance),
    },
    {
      key: 'assignedTo',
      header: 'Asignado a',
      render: (row) => row.assignedTo ?? '—',
    },
    {
      key: 'assignedOrderId',
      header: 'OT asociada',
      render: (row) => {
        if (!row.assignedOrderId) return '—'
        return (
          <Button
            type="button"
            size="sm"
            variant="outline"
            leftIcon={<ExternalLink className="h-3.5 w-3.5" />}
            onClick={(e) => {
              e.stopPropagation()
              const order = orders.find((o) => o.id === row.assignedOrderId)
              if (!order) {
                navigate(ROUTES.ORDENES)
                return
              }
              updateOrder(order.id, { equipmentId: row.id })
              navigate(ROUTES.ORDENES)
              openViewModal({ ...order, equipmentId: row.id })
            }}
          >
            {row.assignedOrderId}
          </Button>
        )
      },
    },
    {
      key: 'acciones',
      header: '',
      className: 'w-12 text-right',
      render: (row) => (
        <EquipmentActionsMenu
          equipment={row}
          onView={openView}
          onEdit={openEdit}
          onDelete={openDelete}
        />
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
        <CardHeader title="Maquinaria y equipos" />
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-[200px] flex-1 max-w-md">
            <Input
              placeholder="Buscar por código, serie o ubicación..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search className="h-4 w-4" />}
            />
          </div>
          <div className="min-w-[180px]">
            <label className="mb-1.5 block text-xs font-medium text-slate-600">Estado</label>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as EquipmentStatus | 'all')}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt === 'all' ? 'Todos los estados' : opt}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <DataTable
          columns={columns}
          data={filtered}
          keyExtractor={(row) => row.id}
          onRowClick={(row) => openView(row)}
          selectedKey={selected?.id ?? null}
        />
      </Card>

      <Card>
        <CardHeader
          title="Calendario de mantenimiento"
          subtitle="Equipos ordenados por próxima mantención programada."
        />
        {maintenanceCalendar.length === 0 ? (
          <p className="text-sm text-slate-500">No hay equipos registrados.</p>
        ) : (
          <ul className="space-y-2">
            {maintenanceCalendar.map((eq) => (
              <li
                key={eq.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-100 bg-white px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {eq.code} — {eq.name}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Última: {formatShortDate(eq.lastMaintenance)} · Estado: {eq.status}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Próx. mantención
                    </p>
                    <p className="text-sm font-semibold text-slate-900">
                      {formatShortDate(eq.nextMaintenance)}
                    </p>
                  </div>
                  <EquipmentActionsMenu
                    equipment={eq}
                    onView={openView}
                    onEdit={openEdit}
                    onDelete={openDelete}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <CardHeader
          title="Historial de cambios"
          subtitle="Detalle de cada campo modificado en equipos y maquinaria."
        />
        {history.length === 0 ? (
          <p className="text-sm text-slate-500">Aún no hay cambios registrados.</p>
        ) : (
          <ul className="max-h-[28rem] space-y-2 overflow-y-auto text-sm">
            {history.map((h) => (
              <li key={h.id} className="rounded-lg border border-slate-100 bg-white p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="font-medium text-slate-900">
                    {h.equipmentCode} — {h.equipmentName}
                  </p>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                    {h.actionLabel}
                  </span>
                </div>
                <ul className="mt-2 space-y-1 text-slate-700">
                  {h.changes.map((change) => (
                    <li key={change} className="flex gap-2 text-sm">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      <span>{change}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-xs text-slate-400">
                  {new Date(h.date).toLocaleString('es-CL')} · {h.user}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <EquipmentViewModal
        equipment={selected}
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        onEdit={(eq) => {
          setSelected(eq)
          setEditOpen(true)
        }}
      />
      <EquipmentEditModal
        equipment={selected}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSaved={() => {
          void loadHistory()
        }}
      />
      <EquipmentDeleteModal
        equipment={selected}
        open={deleteOpen}
        onClose={() => {
          setDeleteOpen(false)
          setSelected(null)
        }}
      />
    </div>
  )
}
