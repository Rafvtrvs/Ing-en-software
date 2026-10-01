import { useMemo, useState } from 'react'
import { Search, Truck } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { KpiCard } from '@/components/ui/KpiCard'
import { mockEquipment } from '@/data/mock/equipment'
import { useOrdersStore } from '@/store/useOrdersStore'
import {
  determineMachineryAvailability,
  filterByAvailabilityStatus,
  type MachineryAvailabilityRow,
} from '@/features/inventory/utils/machineryAvailability'
import type { MachineryAvailabilityStatus } from '@/types'
import { formatShortDate } from '@/utils/formatters'
import { AlertTriangle, CheckCircle, LoaderCircle } from 'lucide-react'

const FILTER_OPTIONS: Array<MachineryAvailabilityStatus | 'all'> = [
  'all',
  'Disponible',
  'En uso',
  'No disponible',
]

const badgeStyles: Record<MachineryAvailabilityStatus, string> = {
  Disponible: 'bg-emerald-50 text-emerald-700',
  'En uso': 'bg-blue-50 text-blue-700',
  'No disponible': 'bg-red-50 text-red-700',
}

/**
 * RF67 — CDS 230/231/232: Disponibilidad de maquinaria
 */
export function MachineryAvailabilityPanel() {
  const orders = useOrdersStore((s) => s.orders)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<MachineryAvailabilityStatus | 'all'>('all')

  const rows = useMemo(
    () => mockEquipment.map((eq) => determineMachineryAvailability(eq, orders)),
    [orders],
  )

  const filtered = useMemo(() => {
    const byStatus = filterByAvailabilityStatus(rows, statusFilter)
    const q = search.toLowerCase().trim()
    if (!q) return byStatus
    return byStatus.filter(
      (r) =>
        r.equipment.name.toLowerCase().includes(q) ||
        r.equipment.code.toLowerCase().includes(q) ||
        r.equipment.category.toLowerCase().includes(q),
    )
  }, [rows, statusFilter, search])

  const kpis = useMemo(() => {
    const total = rows.length
    const available = rows.filter((r) => r.availability === 'Disponible').length
    const inUse = rows.filter((r) => r.availability === 'En uso').length
    const unavailable = rows.filter((r) => r.availability === 'No disponible').length
    return { total, available, inUse, unavailable }
  }, [rows])

  const columns: Column<MachineryAvailabilityRow>[] = [
    {
      key: 'name',
      header: 'Maquinaria',
      render: (row) => (
        <div>
          <p className="font-medium text-slate-900">{row.equipment.name}</p>
          <p className="text-xs text-slate-500">{row.equipment.category}</p>
        </div>
      ),
    },
    {
      key: 'code',
      header: 'Identificador',
      render: (row) => row.equipment.code,
    },
    {
      key: 'type',
      header: 'Tipo',
      render: (row) => row.equipment.category,
    },
    {
      key: 'status',
      header: 'Estado determinado',
      render: (row) => (
        <Badge label={row.availability} className={badgeStyles[row.availability]} />
      ),
    },
    {
      key: 'assignment',
      header: 'Asignación',
      render: (row) => (
        <div className="text-sm text-slate-600">
          <p>{row.assignment}</p>
          {row.reason && (
            <p className="text-xs text-slate-500">Motivo: {row.reason}</p>
          )}
        </div>
      ),
    },
    {
      key: 'lastInfo',
      header: 'Última información',
      render: (row) => formatShortDate(row.lastInfo),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          data={{
            title: 'Total maquinaria',
            value: String(kpis.total),
            trend: 'Equipos registrados',
            trendDirection: 'up',
            icon: Truck,
            iconBg: 'bg-blue-50',
            iconColor: 'text-blue-600',
          }}
        />
        <KpiCard
          data={{
            title: 'Disponible',
            value: String(kpis.available),
            trend: 'Activo sin asignación',
            trendDirection: 'up',
            icon: CheckCircle,
            iconBg: 'bg-emerald-50',
            iconColor: 'text-emerald-600',
          }}
        />
        <KpiCard
          data={{
            title: 'En uso',
            value: String(kpis.inUse),
            trend: 'Asignados a OT',
            trendDirection: 'up',
            icon: LoaderCircle,
            iconBg: 'bg-violet-50',
            iconColor: 'text-violet-600',
          }}
        />
        <KpiCard
          data={{
            title: 'No disponible',
            value: String(kpis.unavailable),
            trend: 'Mantenimiento / fuera de servicio',
            trendDirection: 'down',
            icon: AlertTriangle,
            iconBg: 'bg-red-50',
            iconColor: 'text-red-600',
          }}
        />
      </div>

      <Card>
        <CardHeader
          title="Disponibilidad de maquinaria"
          subtitle="Consulta, filtrado y determinación automática de estado."
        />
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-[200px] flex-1 max-w-md">
            <Input
              placeholder="Buscar maquinaria..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search className="h-4 w-4" />}
            />
          </div>
          <div className="min-w-[180px]">
            <label className="mb-1.5 block text-xs font-medium text-slate-600">Estado</label>
            <Select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as MachineryAvailabilityStatus | 'all')
              }
            >
              {FILTER_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt === 'all' ? 'Todos' : opt === 'Disponible' ? 'Activo' : opt}
                </option>
              ))}
            </Select>
          </div>
        </div>
        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            No hay maquinaria que coincida con el filtro.
          </p>
        ) : (
          <div className="rounded-lg border border-slate-100">
            <DataTable
              columns={columns}
              data={filtered}
              keyExtractor={(r) => r.equipment.id}
              tableClassName="min-w-[720px]"
            />
          </div>
        )}
      </Card>
    </div>
  )
}
