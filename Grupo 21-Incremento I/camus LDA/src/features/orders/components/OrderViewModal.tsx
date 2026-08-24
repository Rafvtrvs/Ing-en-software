import { MapPin, Tag, User, Wrench } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useOrdersStore } from '@/store/useOrdersStore'
import type { WorkOrder } from '@/types'

interface OrderViewModalProps {
  order: WorkOrder | null
  open: boolean
  onClose: () => void
}

function Row({ icon: Icon, label, value }: { icon: typeof User; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg bg-slate-50 px-4 py-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
        <p className="mt-0.5 text-sm font-medium text-slate-900">{value}</p>
      </div>
    </div>
  )
}

export function OrderViewModal({ order, open, onClose }: OrderViewModalProps) {
  const openEditModal = useOrdersStore((s) => s.openEditModal)

  if (!order) return null

  const handleEdit = () => {
    onClose()
    openEditModal(order)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Detalle de Orden"
      description="Información principal de la orden de trabajo."
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          <Button onClick={handleEdit}>Editar</Button>
        </>
      }
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">{order.createdAt}</p>
          <h3 className="text-xl font-bold text-slate-900">{order.id}</h3>
          <p className="mt-1 text-sm text-slate-600">{order.client}</p>
        </div>
        <Badge label={order.status} context="order" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Row icon={MapPin} label="Dirección" value={order.address} />
        <Row icon={Tag} label="Categoría" value={order.category} />
        <Row icon={Wrench} label="Servicio" value={order.service ?? '—'} />
        <Row icon={User} label="Técnico" value={order.technician ?? 'Sin asignar'} />
      </div>

      <div className="mt-4 rounded-lg border border-slate-100 bg-white p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Progreso</span>
          <span className="font-semibold text-slate-900">{order.progress ?? 0}%</span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${Math.min(100, Math.max(0, order.progress ?? 0))}%` }}
          />
        </div>
      </div>
    </Modal>
  )
}

