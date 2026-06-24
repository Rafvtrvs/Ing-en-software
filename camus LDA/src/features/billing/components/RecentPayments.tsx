import { CreditCard } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { useBillingStore } from '@/store/useBillingStore'
import { formatInvoiceAmount } from '@/features/billing/utils/exportBilling'
import { formatShortDate } from '@/utils/formatters'

export function RecentPayments() {
  const payments = useBillingStore((s) => s.payments)

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
    </Card>
  )
}
