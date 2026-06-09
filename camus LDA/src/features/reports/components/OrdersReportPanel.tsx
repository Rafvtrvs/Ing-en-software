import { KpiCard } from '@/components/ui/KpiCard'
import { getOrdersReportKpis } from '@/data/mock/reports'
import { useOrdersStore } from '@/store/useOrdersStore'
import {
  getOrdersByCategory,
  getOrdersByStatusChart,
} from '@/features/reports/utils/reportStats'
import { ReportDonutChart } from './ReportDonutChart'
import { ReportBarChart } from './ReportBarChart'
import { OrdersTrendChart } from './OrdersTrendChart'
import { ReportExportCatalog } from './ReportExportCatalog'

export function OrdersReportPanel() {
  const orders = useOrdersStore((s) => s.orders)

  const kpis = getOrdersReportKpis({
    total: orders.length,
    pending: orders.filter((o) => o.status === 'Pendiente').length,
    inProgress: orders.filter((o) => o.status === 'En Curso').length,
    completed: orders.filter((o) => o.status === 'Completada').length,
  })

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.title} data={kpi} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ReportDonutChart title="Órdenes por Estado" data={getOrdersByStatusChart(orders)} />
        <OrdersTrendChart />
      </div>

      <ReportBarChart title="Órdenes por Categoría de Falla" data={getOrdersByCategory(orders)} />

      <ReportExportCatalog filterTab="ordenes" />
    </div>
  )
}
