import { DollarSign } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { formatCurrency } from '@/utils/formatters'
import type { Invoice, PaymentRecord } from '@/types'

interface FinancialIncomeBlockProps {
  invoices: Invoice[]
  payments: PaymentRecord[]
}

export function FinancialIncomeBlock({ invoices, payments }: FinancialIncomeBlockProps) {
  const paid = invoices
    .filter((inv) => inv.status === 'Pagada')
    .reduce((sum, inv) => sum + inv.amount, 0)
  const pending = invoices
    .filter((inv) => inv.status === 'Emitida' || inv.status === 'Borrador')
    .reduce((sum, inv) => sum + inv.amount, 0)
  const overdue = invoices
    .filter((inv) => inv.status === 'Vencida')
    .reduce((sum, inv) => sum + inv.amount, 0)
  const recentPaymentsTotal = payments
    .slice(0, 5)
    .reduce((sum, p) => sum + p.amount, 0)

  const rows = [
    { label: 'Ingresos cobrados', value: formatCurrency(paid), hint: 'Facturas pagadas' },
    { label: 'Por cobrar', value: formatCurrency(pending), hint: 'Emitidas / borrador' },
    { label: 'Vencidas', value: formatCurrency(overdue), hint: 'Requieren seguimiento' },
    {
      label: 'Pagos recientes',
      value: formatCurrency(recentPaymentsTotal),
      hint: `${Math.min(payments.length, 5)} últimos registros`,
    },
  ]

  return (
    <Card>
      <CardHeader
        title="Ingresos financieros"
        subtitle="Resumen de facturación y cobros"
        action={<DollarSign className="h-5 w-5 text-emerald-600" />}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        {rows.map((row) => (
          <div
            key={row.label}
            className="rounded-lg border border-slate-100 bg-slate-50/60 px-4 py-3"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {row.label}
            </p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{row.value}</p>
            <p className="mt-0.5 text-xs text-slate-500">{row.hint}</p>
          </div>
        ))}
      </div>
    </Card>
  )
}
