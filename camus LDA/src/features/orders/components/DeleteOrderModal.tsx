import { AlertTriangle } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useOrdersStore } from '@/store/useOrdersStore'
import type { WorkOrder } from '@/types'

interface DeleteOrderModalProps {
  order: WorkOrder | null
  open: boolean
  onClose: () => void
}

export function DeleteOrderModal({ order, open, onClose }: DeleteOrderModalProps) {
  const deleteOrder = useOrdersStore((s) => s.deleteOrder)
  const addToast = useOrdersStore((s) => s.addToast)

  if (!order) return null

  const handleDelete = () => {
    deleteOrder(order.id)
    addToast(`Orden "${order.id}" eliminada`, 'info')
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Eliminar Orden"
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button className="bg-red-600 hover:bg-red-700" onClick={handleDelete}>
            Eliminar
          </Button>
        </>
      }
    >
      <div className="flex flex-col items-center gap-4 py-2 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
          <AlertTriangle className="h-7 w-7 text-red-500" />
        </div>
        <div>
          <p className="font-medium text-slate-900">
            ¿Eliminar la orden <strong>{order.id}</strong>?
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Esta acción no se puede deshacer.
          </p>
        </div>
      </div>
    </Modal>
  )
}

