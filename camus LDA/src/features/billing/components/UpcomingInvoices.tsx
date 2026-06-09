import { AlertTriangle, Calendar } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useBillingStore } from '@/store/useBillingStore'
import { getUpcomingDue } from '@/features/billing/utils/billingStats'
import { formatInvoiceAmount } from '@/features/billing/utils/exportBilling'
import { formatShortDate } from '@/utils/formatters'

export function UpcomingInvoices() {
  const invoices = useBillingStore((s) => s.invoices)
  const upcoming = getUpcomingDue(invoices)

  return (
    <Card>
      <CardHeader
        title="Próximos Vencimientos"
        action={
          <span className="flex items-center gap-1 text-xs text-slate-500">
            <Calendar className="h-3.5 w-3.5" />
            Por cobrar
          </span>
        }
      />
      {upcoming.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500">No hay vencimientos pendientes</p>
      ) : (
        <ul className="space-y-3">
          {upcoming.map(({ invoice, daysLeft }) => (
            <li
              key={invoice.id}
              className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/50 px-3 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900">{invoice.client}</p>
                <p className="text-xs text-slate-500">
                  {invoice.number} · vence {formatShortDate(invoice.dueDate)}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-semibold text-slate-900">
                  {formatInvoiceAmount(invoice.amount)}
                </p>
                {daysLeft < 0 ? (
                  <span className="inline-flex items-center gap-0.5 text-xs font-medium text-red-600">
                    <AlertTriangle className="h-3 w-3" />
                    Vencida
                  </span>
                ) : (
                  <span className="text-xs text-slate-500">
                    {daysLeft === 0 ? 'Hoy' : `${daysLeft} días`}
                  </span>
                )}
                <div className="mt-1">
                  <Badge label={invoice.status} context="billing" />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
