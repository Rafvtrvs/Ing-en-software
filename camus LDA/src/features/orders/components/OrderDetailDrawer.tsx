import {
  Calendar,
  MapPin,
  Pencil,
  Play,
  Tag,
  Trash2,
  Truck,
  User,
  Wrench,
} from 'lucide-react'
import { Drawer } from '@/components/ui/Drawer'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useOrdersStore } from '@/store/useOrdersStore'
import { useInventoryStore } from '@/store/useInventoryStore'
import type { OrderStatus, WorkOrder } from '@/types'
import { cn } from '@/utils/cn'

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof User
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          {label}
        </p>
        <p className="mt-0.5 break-words text-sm font-medium text-slate-900">
          {value}
        </p>
      </div>
    </div>
  )
}

function ProgressBar({ value }: { value: number }) {
  const pct = Math.min(100, Math.max(0, value))
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-500">Progreso</span>
        <span className="font-semibold text-slate-900">{pct}%</span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function MapCard({ address }: { address: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
        <MapPin className="h-4 w-4 text-slate-400" />
        Ubicación
      </div>
      <div className="mt-3 overflow-hidden rounded-lg border border-slate-100 bg-slate-50">
        <div className="flex h-32 items-center justify-center">
          <div className="text-center">
            <MapPin className="mx-auto h-6 w-6 text-slate-300" />
            <p className="mt-2 text-xs text-slate-500">Mapa (placeholder)</p>
          </div>
        </div>
      </div>
      <p className="mt-3 text-sm text-slate-600">{address}</p>
    </div>
  )
}

function nextStatus(status: OrderStatus): OrderStatus | null {
  if (status === 'Pendiente') return 'En Curso'
  if (status === 'En Curso') return 'Completada'
  return null
}

export function OrderDetailDrawer({
  open,
  order,
  onClose,
}: {
  open: boolean
  order: WorkOrder | null
  onClose: () => void
}) {
  const openEditModal = useOrdersStore((s) => s.openEditModal)
  const openDeleteModal = useOrdersStore((s) => s.openDeleteModal)
  const updateOrder = useOrdersStore((s) => s.updateOrder)
  const addToast = useOrdersStore((s) => s.addToast)
  const products = useInventoryStore((s) => s.products)

  const isReady = Boolean(order)
  const status = order?.status ?? 'Pendiente'
  const next = nextStatus(status)
  const assignedTruck = order?.truckCode
    ? products.find((p) => p.code === order.truckCode) ?? null
    : null

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Detalle de Orden"
      footer={
        !isReady ? null : (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              leftIcon={<Pencil className="h-4 w-4" />}
              onClick={() => {
                if (!order) return
                onClose()
                openEditModal(order)
              }}
            >
              Editar
            </Button>
            <Button
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50"
              leftIcon={<Trash2 className="h-4 w-4" />}
              onClick={() => {
                if (!order) return
                onClose()
                openDeleteModal(order)
              }}
            >
              Eliminar
            </Button>
            {next && (
              <Button
                leftIcon={<Play className="h-4 w-4" />}
                onClick={() => {
                  if (!order) return
                  updateOrder(order.id, { status: next, progress: next === 'En Curso' ? Math.max(order.progress ?? 0, 10) : 100 })
                  addToast(next === 'En Curso' ? 'Orden iniciada' : 'Orden completada')
                }}
              >
                {status === 'Pendiente' ? 'Iniciar Trabajo' : 'Completar'}
              </Button>
            )}
          </div>
        )
      }
    >
      {!order ? (
        <p className="text-sm text-slate-500">Selecciona una orden para ver su detalle.</p>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500">ID Orden</p>
                <p className="mt-1 truncate text-lg font-bold text-slate-900">
                  {order.id}
                </p>
                <p className="mt-1 truncate text-sm text-slate-600">
                  {order.client}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge label={order.status} context="order" />
                <span
                  className={cn(
                    'rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset',
                    order.priority === 'Alta'
                      ? 'bg-red-50 text-red-700 ring-red-600/20'
                      : order.priority === 'Media'
                        ? 'bg-amber-50 text-amber-700 ring-amber-600/20'
                        : 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
                  )}
                >
                  Prioridad {order.priority ?? 'Media'}
                </span>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
              <Calendar className="h-4 w-4 text-slate-400" />
              {order.createdAt}
            </div>
          </div>

          <div className="grid gap-3">
            <InfoRow icon={Wrench} label="Descripción" value={order.service ?? '—'} />
            <InfoRow icon={MapPin} label="Dirección" value={order.address} />
            <InfoRow icon={Tag} label="Categoría" value={order.category} />
            <InfoRow
              icon={Truck}
              label="Camión asignado"
              value={
                assignedTruck
                  ? `${assignedTruck.code} — ${assignedTruck.name}`
                  : order.truckCode
                    ? order.truckCode
                    : 'Sin asignar'
              }
            />
            <InfoRow icon={User} label="Técnico" value={order.technician ?? 'Sin asignar'} />
          </div>

          <ProgressBar value={order.progress ?? 0} />
          <MapCard address={order.address} />
        </div>
      )}
    </Drawer>
  )
}

