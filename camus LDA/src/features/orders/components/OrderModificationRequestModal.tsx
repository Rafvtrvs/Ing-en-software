import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { FormField } from '@/components/ui/FormField'
import { useOrdersStore } from '@/store/useOrdersStore'
import { useSessionUser } from '@/features/auth/useSessionUser'
import type { WorkOrder } from '@/types'

interface OrderModificationRequestModalProps {
  order: WorkOrder | null
  open: boolean
  onClose: () => void
}

/** RF68 — CDS 233: Solicitar modificación de orden */
export function OrderModificationRequestModal({
  order,
  open,
  onClose,
}: OrderModificationRequestModalProps) {
  const submitModificationRequest = useOrdersStore((s) => s.submitModificationRequest)
  const addToast = useOrdersStore((s) => s.addToast)
  const currentUser = useSessionUser()
  const [fields, setFields] = useState('')
  const [reason, setReason] = useState('')

  if (!order) return null

  const handleSubmit = () => {
    const result = submitModificationRequest(
      order.id,
      { fieldsToModify: fields, reason },
      {
        id: currentUser.id ?? 'u3',
        name: currentUser.name ?? 'Operador',
      },
    )
    if (!result.ok) {
      addToast(result.message ?? 'Error al enviar solicitud', 'error')
      return
    }
    setFields('')
    setReason('')
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Solicitud de modificación"
      description="Solicite cambios en la orden asignada. Estado inicial: Pendiente de aprobación."
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!fields.trim() || !reason.trim()}>
            Enviar solicitud
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-xl bg-slate-50 p-4 text-sm">
          <p>
            <span className="text-slate-500">Orden:</span> <strong>{order.id}</strong>
          </p>
          <p className="mt-1">
            <span className="text-slate-500">Operador:</span>{' '}
            {currentUser.name ?? order.technician}
          </p>
        </div>
        <FormField label="Campos que desea modificar" required>
          <Input
            placeholder="Ej: Dirección, Descripción del servicio"
            value={fields}
            onChange={(e) => setFields(e.target.value)}
          />
        </FormField>
        <FormField label="Motivo de la solicitud" required>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explique por qué necesita modificar la orden..."
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </FormField>
      </div>
    </Modal>
  )
}
