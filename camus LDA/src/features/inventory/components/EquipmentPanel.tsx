import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ExternalLink, Search, Wrench } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { KpiCard } from '@/components/ui/KpiCard'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { FormField } from '@/components/ui/FormField'
import { mockEquipment } from '@/data/mock/equipment'
import type { Equipment, EquipmentStatus } from '@/types'
import { formatShortDate } from '@/utils/formatters'
import { AlertTriangle, CheckCircle, Settings } from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { useOrdersStore } from '@/store/useOrdersStore'
import { useInventoryStore } from '@/store/useInventoryStore'

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
  const addToast = useInventoryStore((s) => s.addToast)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<EquipmentStatus | 'all'>('all')
  const [items, setItems] = useState<Equipment[]>(mockEquipment)
  const [selected, setSelected] = useState<Equipment | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [draftStatus, setDraftStatus] = useState<EquipmentStatus>('Operativo')
  const [history, setHistory] = useState<
    Array<{
      id: string
      equipmentCode: string
      equipmentName: string
      from: EquipmentStatus
      to: EquipmentStatus
      date: string
    }>
  >([])

  useEffect(() => {
    if (!editOpen || !selected) return
    setDraftStatus(selected.status)
  }, [editOpen, selected])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return items.filter((eq) => {
      const matchesSearch =
        !q ||
        eq.name.toLowerCase().includes(q) ||
        eq.code.toLowerCase().includes(q) ||
        eq.serialNumber.toLowerCase().includes(q) ||
        eq.location.toLowerCase().includes(q)
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
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
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

  const isEquipmentInActiveOrder = (equipment: Equipment): { active: boolean; orderId?: string } => {
    // 1) Si el equipo ya declara OT asociada
    if (equipment.assignedOrderId) {
      const o = orders.find((ord) => ord.id === equipment.assignedOrderId)
      if (o && (o.status === 'Pendiente' || o.status === 'En Curso')) {
        return { active: true, orderId: o.id }
      }
    }

    // 2) Si alguna OT tiene equipmentId == equipo.id
    const linked = orders.find(
      (ord) =>
        ord.equipmentId === equipment.id &&
        (ord.status === 'Pendiente' || ord.status === 'En Curso'),
    )
    if (linked) return { active: true, orderId: linked.id }
    return { active: false }
  }

  const openEdit = (row: Equipment) => {
    setSelected(row)
    setEditOpen(true)
  }

  const saveEdit = () => {
    if (!selected) return
    if (draftStatus === selected.status) {
      addToast('No hay cambios para guardar', 'info')
      setEditOpen(false)
      return
    }

    const active = isEquipmentInActiveOrder(selected)
    if (active.active) {
      addToast(
        `No se puede cambiar el estado: el equipo está en una orden activa (${active.orderId}).`,
        'error',
      )
      return
    }

    setItems((prev) =>
      prev.map((eq) => (eq.id === selected.id ? { ...eq, status: draftStatus } : eq)),
    )
    setHistory((prev) => [
      {
        id: `h-${Date.now()}`,
        equipmentCode: selected.code,
        equipmentName: selected.name,
        from: selected.status,
        to: draftStatus,
        date: new Date().toISOString(),
      },
      ...prev,
    ].slice(0, 10))
    addToast(`Estado del equipo "${selected.code}" actualizado`, 'success')
    setEditOpen(false)
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
              // Vincula el ID del equipo a la OT (orden activa / asociada)
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
      className: 'w-28 text-right',
      render: (row) => (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={(e) => {
            e.stopPropagation()
            openEdit(row)
          }}
        >
          Editar
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
          onRowClick={(row) => openEdit(row)}
          selectedKey={selected?.id ?? null}
        />
      </Card>

      <Card>
        <CardHeader title="Historial de cambios (mock)" subtitle="Últimas modificaciones de estado realizadas." />
        {history.length === 0 ? (
          <p className="text-sm text-slate-500">Aún no hay cambios registrados.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {history.map((h) => (
              <li key={h.id} className="rounded-lg border border-slate-100 bg-white p-3">
                <p className="font-medium text-slate-900">
                  {h.equipmentCode} — {h.equipmentName}
                </p>
                <p className="mt-0.5 text-slate-600">
                  Estado: <span className="font-semibold">{h.from}</span> →{' '}
                  <span className="font-semibold">{h.to}</span>
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Editar equipo"
        description="Modifica el estado del equipo. No se permitirá si está asociado a una orden activa."
        size="md"
        footer={
          <>
            <Button variant="outline" type="button" onClick={() => setEditOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={saveEdit}>
              Guardar
            </Button>
          </>
        }
      >
        {!selected ? null : (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
              <p className="text-sm font-semibold text-slate-900">
                {selected.code} — {selected.name}
              </p>
              <p className="mt-1 text-xs text-slate-500">{selected.location}</p>
            </div>

            <FormField label="Estado" htmlFor="equipment-status" required>
              <Select
                id="equipment-status"
                value={draftStatus}
                onChange={(e) => setDraftStatus(e.target.value as EquipmentStatus)}
              >
                {STATUS_OPTIONS.filter((s) => s !== 'all').map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>
        )}
      </Modal>
    </div>
  )
}
