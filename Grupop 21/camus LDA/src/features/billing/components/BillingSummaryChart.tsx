import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import { Card, CardHeader } from '@/components/ui/Card'
import { ChartLegend } from '@/components/ui/ChartLegend'
import { useBillingStore } from '@/store/useBillingStore'
import { getInvoicesByStatus } from '@/features/billing/utils/billingStats'

export function BillingSummaryChart() {
  const invoices = useBillingStore((s) => s.invoices)
  const chartData = getInvoicesByStatus(invoices)
  const total = chartData.reduce((sum, item) => sum + item.value, 0)

  return (
    <Card>
      <CardHeader title="Facturas por Estado" />
      {total === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">Sin facturas registradas</p>
      ) : (
        <div className="flex flex-col items-center gap-8 md:flex-row md:items-center md:justify-between">
          <div className="relative h-48 w-48 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={78}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-slate-900">{total}</span>
              <span className="text-xs text-slate-500">Total</span>
            </div>
          </div>
          <ChartLegend
            className="md:min-w-[200px] md:flex-1 md:max-w-[240px]"
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
