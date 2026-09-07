import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useBillingStore } from '@/store/useBillingStore'
import { formatInvoiceAmount } from '@/features/billing/utils/exportBilling'
import type { Invoice, PaymentMethod } from '@/types'

interface RegisterPaymentModalProps {
  invoice: Invoice | null
  open: boolean
  onClose: () => void
}

export function RegisterPaymentModal({ invoice, open, onClose }: RegisterPaymentModalProps) {
  const registerPayment = useBillingStore((s) => s.registerPayment)
  const addToast = useBillingStore((s) => s.addToast)

  const paidSoFar = invoice?.paidAmount ?? 0
  const pending = invoice ? invoice.amount - paidSoFar : 0

  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState<PaymentMethod>('Transferencia')
  const [reference, setReference] = useState('')
  const [notes, setNotes] = useState('')

  const entered = Number(amount)
  const computedPending =
    invoice && Number.isFinite(entered) && entered > 0
      ? Math.max(pending - entered, 0)
      : pending
  const willBeFullyPaid = invoice ? entered >= pending : false

  useEffect(() => {
    if (open && invoice) {
      setAmount(String(pending))
      setMethod('Transferencia')
      setReference('')
      setNotes('')
    }
  }, [open, invoice, pending])

  if (!invoice) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const value = Number(amount)
    if (!value || value <= 0) {
      addToast('Ingresa un monto válido', 'error')
      return
    }
    if (value > pending) {
      addToast('El monto supera el saldo pendiente', 'error')
      return
    }
    registerPayment(invoice.id, {
      amount: value,
      method,
      reference,
      notes,
    })
    addToast(
      value >= pending
        ? `Pago total registrado — Factura ${invoice.number}`
        : `Abono parcial registrado — Factura ${invoice.number}`,
    )
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Registrar pago"
      description={`Factura ${invoice.number} — ${invoice.client}`}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="register-payment-form">
            Confirmar pago
          </Button>
        </>
      }
    >
      <form id="register-payment-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-3 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-3">
          <div>
            <p className="text-slate-500">Monto total</p>
            <p className="font-semibold text-slate-900">{formatInvoiceAmount(invoice.amount)}</p>
          </div>
          <div>
            <p className="text-slate-500">Pagado</p>
            <p className="font-semibold text-emerald-600">{formatInvoiceAmount(paidSoFar)}</p>
          </div>
          <div>
            <p className="text-slate-500">Pendiente</p>
            <p className="font-semibold text-amber-600">{formatInvoiceAmount(pending)}</p>
          </div>
        </div>

        <FormField label="Monto a pagar">
          <Input
            type="number"
            min={1}
            max={pending}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </FormField>

        <div className="grid gap-3 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2">
          <div>
            <p className="text-slate-500">Saldo pendiente (post-pago)</p>
            <p className="font-semibold text-slate-900">
              {formatInvoiceAmount(computedPending)}
            </p>
          </div>
          <div>
            <p className="text-slate-500">Estado resultante</p>
            <Select value={willBeFullyPaid ? 'Pagada' : invoice.status} disabled>
              <option value="Emitida">Emitida</option>
              <option value="Vencida">Vencida</option>
              <option value="Pagada">Pagada</option>
            </Select>
          </div>
        </div>

        <FormField label="Medio de pago">
          <Select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
            <option value="Transferencia">Transferencia</option>
            <option value="Efectivo">Efectivo</option>
            <option value="Cheque">Cheque</option>
            <option value="Tarjeta">Tarjeta</option>
          </Select>
        </FormField>

        <FormField label="Referencia / N° transacción">
          <Input
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="TRX-2026-001234"
          />
        </FormField>

        <FormField label="Observaciones">
          <Input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Opcional"
          />
        </FormField>
      </form>
    </Modal>
  )
}
