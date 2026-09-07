import { CheckCircle, Clock, DollarSign, FileText } from 'lucide-react'
import { KpiCard } from '@/components/ui/KpiCard'
import type { KpiData } from '@/types'
import { useBillingStore } from '@/store/useBillingStore'
import { formatCurrency } from '@/utils/formatters'
import { getBillingRevenueStats } from '@/features/reports/utils/reportStats'
import { getInvoicesByStatus } from '@/features/billing/utils/billingStats'
import { RevenueTrendChart } from './RevenueTrendChart'
import { ReportDonutChart } from './ReportDonutChart'
import { ReportExportCatalog } from './ReportExportCatalog'

export function BillingReportPanel() {
  const invoices = useBillingStore((s) => s.invoices)
  const stats = getBillingRevenueStats(invoices)
  const statusChart = getInvoicesByStatus(invoices)

  const kpis: KpiData[] = [
    {
      title: 'Total Facturado',
      value: formatCurrency(stats.totalBilled).replace(/\s/g, ' '),
      trend: 'Período actual',
      trendDirection: 'up',
      icon: FileText,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Total Cobrado',
      value: formatCurrency(stats.totalCollected).replace(/\s/g, ' '),
      trend: `${stats.paidCount} facturas pagadas`,
      trendDirection: 'up',
      icon: CheckCircle,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
    },
    {
      title: 'Por Cobrar',
      value: formatCurrency(stats.pendingAmount).replace(/\s/g, ' '),
      trend: `${stats.pendingCount} pendientes`,
      trendDirection: 'down',
      icon: Clock,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
    },
    {
      title: 'Tasa de Cobro',
      value: stats.totalBilled
        ? `${Math.round((stats.totalCollected / stats.totalBilled) * 100)}%`
        : '0%',
      trend: 'Del total facturado',
      trendDirection: 'up',
      icon: DollarSign,
      iconBg: 'bg-violet-50',
      iconColor: 'text-violet-600',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.title} data={kpi} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <RevenueTrendChart />
        <ReportDonutChart title="Facturas por Estado" data={statusChart} />
      </div>

      <ReportExportCatalog filterTab="facturacion" />
    </div>
  )
}
