import { useMemo } from 'react'
import { useBillingStore } from '@/store/useBillingStore'
import { Button } from '@/components/ui/Button'
import { formatInvoiceAmount } from '@/features/billing/utils/exportBilling'

/** RF-19 — utilidad = ingresos − costos (vista local con datos del sistema) */
export function UtilityReportPanel() {
  const invoices = useBillingStore((s) => s.invoices)
  const payments = useBillingStore((s) => s.payments)

  const summary = useMemo(() => {
    const income = payments.reduce((sum, payment) => sum + payment.amount, 0)
    const billed = invoices.reduce((sum, invoice) => sum + invoice.amount, 0)
    // Costos operativos estimados: 55 % de lo facturado (demo local sin API externa)
    const costs = Math.round(billed * 0.55)
    const utility = income - costs
    return { income, billed, costs, utility }
  }, [invoices, payments])

  const exportCsv = () => {
    const rows = [
      'Concepto;Monto',
      `Ingresos por pagos;${summary.income}`,
      `Facturado;${summary.billed}`,
      `Costos operacionales estimados;${summary.costs}`,
      `Utilidad;${summary.utility}`,
    ]
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `utilidad-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Utilidad del periodo</h2>
          <p className="mt-1 text-sm text-slate-500">
            Ingresos por pagos menos costos operacionales estimados (RF-19).
          </p>
        </div>
        <Button type="button" variant="outline" onClick={exportCsv}>
          Exportar CSV
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3">
          <p className="text-xs font-medium uppercase text-slate-500">Ingresos</p>
          <p className="mt-1 text-lg font-bold text-slate-900">
            {formatInvoiceAmount(summary.income)}
          </p>
        </div>
        <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3">
          <p className="text-xs font-medium uppercase text-slate-500">Facturado</p>
          <p className="mt-1 text-lg font-bold text-slate-900">
            {formatInvoiceAmount(summary.billed)}
          </p>
        </div>
        <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3">
          <p className="text-xs font-medium uppercase text-slate-500">Costos</p>
          <p className="mt-1 text-lg font-bold text-slate-900">
            {formatInvoiceAmount(summary.costs)}
          </p>
        </div>
        <div className="rounded-lg border border-emerald-100 bg-emerald-50/70 p-3">
          <p className="text-xs font-medium uppercase text-emerald-700">Utilidad</p>
          <p
            className={`mt-1 text-lg font-bold ${
              summary.utility >= 0 ? 'text-emerald-800' : 'text-red-700'
            }`}
          >
            {formatInvoiceAmount(summary.utility)}
          </p>
        </div>
      </div>
    </div>
  )
}
