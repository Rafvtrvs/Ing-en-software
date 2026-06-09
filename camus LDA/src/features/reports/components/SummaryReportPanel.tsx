import { KpiCard } from '@/components/ui/KpiCard'
import { getSummaryReportKpis, topClientsByOrders } from '@/data/mock/reports'
import { useOrdersStore } from '@/store/useOrdersStore'
import { useClientsStore } from '@/store/useClientsStore'
import { useBillingStore } from '@/store/useBillingStore'
import { useInventoryStore } from '@/store/useInventoryStore'
import {
  getActiveClientsCount,
  getBillingRevenueStats,
  getCriticalProductsCount,
} from '@/features/reports/utils/reportStats'
import { RevenueTrendChart } from './RevenueTrendChart'
import { OrdersTrendChart } from './OrdersTrendChart'
import { ReportBarChart } from './ReportBarChart'
import { ReportExportCatalog } from './ReportExportCatalog'

export function SummaryReportPanel() {
  const orders = useOrdersStore((s) => s.orders)
  const clients = useClientsStore((s) => s.clients)
  const invoices = useBillingStore((s) => s.invoices)
  const products = useInventoryStore((s) => s.products)

  const billing = getBillingRevenueStats(invoices)
  const completed = orders.filter((o) => o.status === 'Completada').length

  const kpis = getSummaryReportKpis({
    totalOrders: orders.length,
    completedOrders: completed,
    totalRevenue: billing.totalBilled,
    criticalProducts: getCriticalProductsCount(products),
    activeClients: getActiveClientsCount(clients),
  })

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.title} data={kpi} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <RevenueTrendChart />
        <OrdersTrendChart />
      </div>

      <ReportBarChart title="Top Clientes por Órdenes" data={topClientsByOrders()} />

      <ReportExportCatalog filterTab="resumen" />
    </div>
  )
}
