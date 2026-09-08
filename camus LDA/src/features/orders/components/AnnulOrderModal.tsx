import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { useOrdersStore } from '@/store/useOrdersStore'
import type { WorkOrder } from '@/types'

/**
 * RF61 — CDS 212: Anulación de orden de trabajo ya existente
 */
export function AnnulOrderModal({
  order,
  open,
  onClose,
}: {
  order: WorkOrder | null
  open: boolean
  onClose: () => void
}) {
  const annulOrder = useOrdersStore((s) => s.annulOrder)
  const addToast = useOrdersStore((s) => s.addToast)
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [confirmed, setConfirmed] = useState(false)

  if (!order) return null

  const handleClose = () => {
    setReason('')
    setError('')
    setConfirmed(false)
    onClose()
  }

  const handleSubmit = () => {
    if (!reason.trim()) {
      setError('El motivo de anulación es obligatorio')
      return
    }
    if (!confirmed) {
      setConfirmed(true)
      return
    }
    if (order.annulled || order.status === 'Cancelada') {
      addToast('Esta orden ya fue anulada o cancelada', 'error')
      return
    }
    annulOrder(order.id, reason)
    setReason('')
    setError('')
    setConfirmed(false)
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Anular Orden"
      description={`Orden ${order.id} — anule solo órdenes creadas por error o duplicadas.`}
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            className="bg-red-600 hover:bg-red-700"
            leftIcon={<AlertTriangle className="h-4 w-4" />}
            onClick={handleSubmit}
          >
            {confirmed ? 'Confirmar Anulación' : 'Anular Orden'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800">
          Anule solo órdenes creadas por error o duplicadas. Esta acción es irreversible.
        </div>
        <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <p>
            <strong>Cliente:</strong> {order.client}
          </p>
          <p className="mt-1">
            <strong>Dirección:</strong> {order.address}
          </p>
        </div>
        <FormField label="Motivo de anulación" required error={error}>
          <textarea
            value={reason}
            onChange={(e) => {
              setReason(e.target.value)
              if (error) setError('')
              setConfirmed(false)
            }}
            rows={4}
            placeholder="Indique el motivo (ej. orden duplicada)..."
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </FormField>
        {confirmed && (
          <p className="text-sm font-medium text-amber-700">
            Confirme nuevamente para anular la orden {order.id}.
          </p>
        )}
      </div>
    </Modal>
  )
}
