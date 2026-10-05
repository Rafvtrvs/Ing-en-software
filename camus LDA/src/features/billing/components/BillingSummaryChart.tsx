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
    <Card className="h-full">
      <CardHeader title="Facturas por Estado" />
      {total === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">Sin facturas registradas</p>
      ) : (
        <div className="flex flex-col items-center gap-6">
          <div className="relative mx-auto h-52 w-52 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={58}
                  outerRadius={82}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-2">
              <span className="max-w-full truncate text-xl font-bold tabular-nums text-slate-900 dark:text-slate-100">
                {total.toLocaleString('es-CL')}
              </span>
              <span className="text-xs text-slate-500">Total</span>
            </div>
          </div>
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
