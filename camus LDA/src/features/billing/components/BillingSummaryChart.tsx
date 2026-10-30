import { Card, CardHeader } from '@/components/ui/Card'
import { ChartLegend } from '@/components/ui/ChartLegend'
import { DonutChart } from '@/components/ui/DonutChart'
import { useBillingStore } from '@/store/useBillingStore'
import { getInvoicesByStatus } from '@/features/billing/utils/billingStats'

export function BillingSummaryChart() {
  const invoices = useBillingStore((s) => s.invoices)
  const chartData = getInvoicesByStatus(invoices)
  const total = chartData.reduce((sum, item) => sum + item.value, 0)

  return (
    <Card className="h-full">
      <CardHeader title="Facturas por Estado" />
      {total === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">Sin facturas registradas</p>
      ) : (
        <div className="flex flex-col items-center gap-6">
          <DonutChart
            data={chartData}
            centerValue={total.toLocaleString('es-CL')}
            centerLabel="Total"
          />
          <ChartLegend
            className="w-full min-w-0"
            items={chartData.map((item) => ({
              name: item.name,
              value: item.value,
              color: item.color ?? '#94a3b8',
            }))}
            total={total}
          />
        </div>
      )}
    </Card>
  )
}
