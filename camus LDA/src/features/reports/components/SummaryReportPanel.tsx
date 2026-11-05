import { useEffect, useMemo } from 'react'
import { KpiCard } from '@/components/ui/KpiCard'
import { useOrdersStore } from '@/store/useOrdersStore'
import { useClientsStore } from '@/store/useClientsStore'
import { useBillingStore } from '@/store/useBillingStore'
import { useInventoryStore } from '@/store/useInventoryStore'
import {
  getActiveClientsCount,
  getBillingRevenueStats,
  getCriticalProductsCount,
  getRevenueByMonth,
  getOrdersTrendByMonth,
  getSummaryReportKpis,
  getTopClientsByOrders,
} from '@/features/reports/utils/reportStats'
import { RevenueTrendChart } from './RevenueTrendChart'
import { OrdersTrendChart } from './OrdersTrendChart'
import { ReportBarChart } from './ReportBarChart'
import { ReportExportCatalog } from './ReportExportCatalog'

export function SummaryReportPanel() {
  const orders = useOrdersStore((s) => s.orders)
  const syncOrders = useOrdersStore((s) => s.syncFromApi)
  const clients = useClientsStore((s) => s.clients)
  const syncClients = useClientsStore((s) => s.syncFromApi)
  const invoices = useBillingStore((s) => s.invoices)
  const syncBilling = useBillingStore((s) => s.syncFromApi)
  const products = useInventoryStore((s) => s.products)
  const syncProducts = useInventoryStore((s) => s.syncProductsFromApi)

  useEffect(() => {
    void Promise.all([
      syncOrders(),
      syncClients(),
      syncBilling(),
      syncProducts(),
    ])
  }, [syncOrders, syncClients, syncBilling, syncProducts])

  const billing = useMemo(() => getBillingRevenueStats(invoices), [invoices])
  const completed = useMemo(
    () => orders.filter((o) => o.status === 'Completada').length,
    [orders],
  )

  const kpis = useMemo(
    () =>
      getSummaryReportKpis({
        totalOrders: orders.length,
        completedOrders: completed,
        totalRevenue: billing.totalBilled,
        criticalProducts: getCriticalProductsCount(products),
        activeClients: getActiveClientsCount(clients),
      }),
    [orders.length, completed, billing.totalBilled, products, clients],
  )

  const revenueSeries = useMemo(() => getRevenueByMonth(invoices), [invoices])
  const ordersSeries = useMemo(() => getOrdersTrendByMonth(orders), [orders])
  const topClients = useMemo(() => getTopClientsByOrders(orders), [orders])

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.title} data={kpi} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <RevenueTrendChart data={revenueSeries} />
        <OrdersTrendChart data={ordersSeries} />
      </div>

      <ReportBarChart title="Top Clientes por Órdenes" data={topClients} />

      <ReportExportCatalog filterTab="resumen" />
    </div>
  )
}
