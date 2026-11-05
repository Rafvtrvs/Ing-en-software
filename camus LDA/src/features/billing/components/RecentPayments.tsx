import { useMemo } from 'react'
import { CreditCard } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { useBillingStore } from '@/store/useBillingStore'
import { formatInvoiceAmount } from '@/features/billing/utils/exportBilling'
import { formatShortDate } from '@/utils/formatters'

export function RecentPayments() {
  const payments = useBillingStore((s) => s.payments)
  const invoices = useBillingStore((s) => s.invoices)

  const totals = useMemo(() => {
    const totalFacturado = invoices
      .filter((i) => i.status !== 'Anulada' && i.status !== 'Borrador')
      .reduce((sum, i) => sum + i.amount, 0)
    const totalCobrado = payments.reduce((sum, p) => sum + p.amount, 0)
    return { totalFacturado, totalCobrado }
  }, [invoices, payments])

  return (
    <Card>
      <CardHeader
        title="Pagos Recientes"
        action={
          <span className="flex items-center gap-1 text-xs text-slate-500">
            <CreditCard className="h-3.5 w-3.5" />
            Últimos registros
          </span>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2.5">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
            Total facturado
          </p>
          <p className="mt-0.5 text-base font-semibold tabular-nums text-slate-900">
            {formatInvoiceAmount(totals.totalFacturado)}
          </p>
        </div>
        <div className="rounded-lg border border-emerald-100 bg-emerald-50/70 px-3 py-2.5">
          <p className="text-[11px] font-medium uppercase tracking-wide text-emerald-700/80">
            Total cobrado
          </p>
          <p className="mt-0.5 text-base font-semibold tabular-nums text-emerald-700">
            {formatInvoiceAmount(totals.totalCobrado)}
          </p>
        </div>
      </div>

      {payments.length === 0 ? (
        <p className="text-sm text-slate-500">
          Aún no hay pagos registrados. Usa “Registrar pago” o “Marcar como pagada”.
        </p>
      ) : (
        <ul className="space-y-3">
          {payments.slice(0, 5).map((payment) => (
            <li
              key={payment.id}
              className="flex items-center justify-between gap-3 border-b border-slate-50 pb-3 last:border-0 last:pb-0"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900">{payment.client}</p>
                <p className="text-xs text-slate-500">
                  {payment.invoiceNumber} · {payment.method}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-semibold text-emerald-700">
                  {formatInvoiceAmount(payment.amount)}
                </p>
                <p className="text-xs text-slate-500">{formatShortDate(payment.date)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
