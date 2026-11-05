import { useEffect, useMemo } from 'react'
import { useBillingStore } from '@/store/useBillingStore'
import { useInventoryStore } from '@/store/useInventoryStore'
import { Button } from '@/components/ui/Button'
import { formatInvoiceAmount } from '@/features/billing/utils/exportBilling'
import { isConsumableStockCategory } from '@/features/inventory/utils/stockCategories'

/** RF-19 — utilidad = ingresos − costos de materiales (costo unitario × salidas) */
export function UtilityReportPanel() {
  const invoices = useBillingStore((s) => s.invoices)
  const payments = useBillingStore((s) => s.payments)
  const syncBilling = useBillingStore((s) => s.syncFromApi)
  const products = useInventoryStore((s) => s.products)
  const movements = useInventoryStore((s) => s.movements)
  const syncProducts = useInventoryStore((s) => s.syncProductsFromApi)
  const syncMovements = useInventoryStore((s) => s.syncMovementsFromApi)

  useEffect(() => {
    void Promise.all([syncBilling(), syncProducts(), syncMovements()])
  }, [syncBilling, syncProducts, syncMovements])

  const summary = useMemo(() => {
    const income = payments.reduce((sum, payment) => sum + payment.amount, 0)
    const billed = invoices
      .filter((i) => i.status !== 'Anulada' && i.status !== 'Borrador')
      .reduce((sum, invoice) => sum + invoice.amount, 0)

    const costByProductId = new Map(
      products.map((p) => [p.id, Math.max(0, p.unitCost ?? 0)]),
    )

    // COGS: salidas de stock × costo unitario del material
    let materialCosts = 0
    for (const mov of movements) {
      if (mov.type !== 'Salida' || mov.quantity <= 0) continue
      const unitCost = costByProductId.get(mov.productId) ?? 0
      materialCosts += mov.quantity * unitCost
    }
    materialCosts = Math.round(materialCosts)

    // Valor de inventario actual (referencia, no resta de utilidad del periodo)
    const inventoryValue = Math.round(
      products
        .filter((p) => isConsumableStockCategory(p.category))
        .reduce(
          (sum, p) => sum + Math.max(0, p.currentStock) * Math.max(0, p.unitCost ?? 0),
          0,
        ),
    )

    const utility = income - materialCosts
    return { income, billed, materialCosts, inventoryValue, utility }
  }, [invoices, payments, products, movements])

  const exportCsv = () => {
    const rows = [
      'Concepto;Monto',
      `Ingresos por pagos;${summary.income}`,
      `Facturado;${summary.billed}`,
      `Costo materiales (salidas);${summary.materialCosts}`,
      `Valor inventario actual;${summary.inventoryValue}`,
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
            Ingresos por pagos menos costo de materiales consumidos (salidas × costo
            unitario registrado en inventario).
          </p>
        </div>
        <Button type="button" variant="outline" onClick={exportCsv}>
          Exportar CSV
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
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
          <p className="text-xs font-medium uppercase text-slate-500">Costo materiales</p>
          <p className="mt-1 text-lg font-bold text-slate-900">
            {formatInvoiceAmount(summary.materialCosts)}
          </p>
        </div>
        <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3">
          <p className="text-xs font-medium uppercase text-slate-500">Valor inventario</p>
          <p className="mt-1 text-lg font-bold text-slate-900">
            {formatInvoiceAmount(summary.inventoryValue)}
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
