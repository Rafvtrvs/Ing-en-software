import { AlertTriangle } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useBillingStore } from '@/store/useBillingStore'
import type { Invoice } from '@/types'

interface DeleteInvoiceModalProps {
  invoice: Invoice | null
  open: boolean
  onClose: () => void
}

export function DeleteInvoiceModal({ invoice, open, onClose }: DeleteInvoiceModalProps) {
  const deleteInvoice = useBillingStore((s) => s.deleteInvoice)
  const addToast = useBillingStore((s) => s.addToast)

  if (!invoice) return null

  const handleDelete = () => {
    deleteInvoice(invoice.id)
    addToast(`Factura ${invoice.number} eliminada`, 'info')
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Eliminar Factura"
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
      <div className="flex flex-col items-center text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
          <AlertTriangle className="h-6 w-6 text-red-600" />
        </div>
        <p className="text-sm text-slate-600">
          ¿Estás seguro de eliminar la factura{' '}
          <span className="font-semibold text-slate-900">{invoice.number}</span> de{' '}
          <span className="font-semibold text-slate-900">{invoice.client}</span>? Esta acción no
          se puede deshacer.
        </p>
      </div>
    </Modal>
  )
}
