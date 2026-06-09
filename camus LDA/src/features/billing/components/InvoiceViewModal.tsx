import { Calendar, FileText, Pencil, User } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useBillingStore } from '@/store/useBillingStore'
import { formatInvoiceAmount } from '@/features/billing/utils/exportBilling'
import { formatShortDate } from '@/utils/formatters'
import type { Invoice } from '@/types'

interface InvoiceViewModalProps {
  invoice: Invoice | null
  open: boolean
  onClose: () => void
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof User
  label: string
  value: string
}) {
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

export function InvoiceViewModal({ invoice, open, onClose }: InvoiceViewModalProps) {
  const openEditModal = useBillingStore((s) => s.openEditModal)
  const markAsPaid = useBillingStore((s) => s.markAsPaid)
  const addToast = useBillingStore((s) => s.addToast)

  if (!invoice) return null

  const handleEdit = () => {
    onClose()
    openEditModal(invoice)
  }

  const handleMarkPaid = () => {
    markAsPaid(invoice.id, 'Transferencia')
    addToast(`Factura ${invoice.number} marcada como pagada`)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Detalle de Factura"
      description="Información completa de la factura seleccionada."
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          {(invoice.status === 'Emitida' || invoice.status === 'Vencida') && (
            <Button variant="secondary" onClick={handleMarkPaid}>
              Marcar como Pagada
            </Button>
          )}
          <Button leftIcon={<Pencil className="h-4 w-4" />} onClick={handleEdit}>
            Editar
          </Button>
        </>
      }
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-900">{invoice.number}</h3>
          <p className="text-sm text-slate-500">{invoice.client}</p>
        </div>
        <Badge label={invoice.status} context="billing" />
      </div>

      <p className="mb-4 text-2xl font-bold text-primary">
        {formatInvoiceAmount(invoice.amount)}
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <DetailRow icon={User} label="RUT" value={invoice.clientRut} />
        <DetailRow
          icon={FileText}
          label="Orden de Trabajo"
          value={invoice.orderId ?? 'Sin orden asociada'}
        />
        <DetailRow icon={Calendar} label="Emisión" value={formatShortDate(invoice.issueDate)} />
        <DetailRow icon={Calendar} label="Vencimiento" value={formatShortDate(invoice.dueDate)} />
        {invoice.paymentMethod && (
          <DetailRow icon={FileText} label="Método de pago" value={invoice.paymentMethod} />
        )}
        {invoice.paidAt && (
          <DetailRow icon={Calendar} label="Fecha de pago" value={formatShortDate(invoice.paidAt)} />
        )}
      </div>

      {invoice.notes && (
        <p className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {invoice.notes}
        </p>
      )}
    </Modal>
  )
}
