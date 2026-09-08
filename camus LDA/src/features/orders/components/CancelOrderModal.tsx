import { useState } from 'react'
import { Ban } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { useOrdersStore } from '@/store/useOrdersStore'
import type { WorkOrder } from '@/types'

/**
 * RF61 — CDS 211: Cancelando orden de trabajo
 */
export function CancelOrderModal({
  order,
  open,
  onClose,
}: {
  order: WorkOrder | null
  open: boolean
  onClose: () => void
}) {
  const cancelOrder = useOrdersStore((s) => s.cancelOrder)
  const addToast = useOrdersStore((s) => s.addToast)
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  if (!order) return null

  const handleClose = () => {
    setReason('')
    setError('')
    onClose()
  }

  const handleSubmit = () => {
    if (!reason.trim()) {
      setError('El motivo de cancelación es obligatorio')
      return
    }
    if (order.status === 'Cancelada') {
      addToast('Esta orden ya está cancelada', 'error')
      return
    }
    cancelOrder(order.id, reason)
    setReason('')
    setError('')
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Cancelar Orden"
      description={`Orden ${order.id} — indique el motivo de cancelación.`}
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            className="bg-amber-600 hover:bg-amber-700"
            leftIcon={<Ban className="h-4 w-4" />}
            onClick={handleSubmit}
          >
            Cancelar Orden
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <p>
            <strong>Cliente:</strong> {order.client}
          </p>
          <p className="mt-1">
            <strong>Servicio:</strong> {order.service ?? order.category}
          </p>
          <p className="mt-1">
            <strong>Estado actual:</strong> {order.status}
          </p>
        </div>
        <FormField label="Motivo de cancelación" required error={error}>
          <textarea
            value={reason}
            onChange={(e) => {
              setReason(e.target.value)
              if (error) setError('')
            }}
            rows={4}
            placeholder="Indique por qué la orden no puede ser ejecutada..."
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </FormField>
      </div>
    </Modal>
  )
}
