import { useEffect, useMemo } from 'react'
import { KpiCard } from '@/components/ui/KpiCard'
import { useOrdersStore } from '@/store/useOrdersStore'
import {
  getOrdersByCategory,
  getOrdersByStatusChart,
  getOrdersReportKpis,
  getOrdersTrendByMonth,
} from '@/features/reports/utils/reportStats'
import { ReportDonutChart } from './ReportDonutChart'
import { ReportBarChart } from './ReportBarChart'
import { OrdersTrendChart } from './OrdersTrendChart'
import { ReportExportCatalog } from './ReportExportCatalog'

export function OrdersReportPanel() {
  const orders = useOrdersStore((s) => s.orders)
  const syncFromApi = useOrdersStore((s) => s.syncFromApi)

  useEffect(() => {
    void syncFromApi()
  }, [syncFromApi])

  const kpis = useMemo(
    () =>
      getOrdersReportKpis({
        total: orders.length,
        pending: orders.filter((o) => o.status === 'Pendiente').length,
        inProgress: orders.filter((o) => o.status === 'En Curso').length,
        completed: orders.filter((o) => o.status === 'Completada').length,
      }),
    [orders],
  )

  const trend = useMemo(() => getOrdersTrendByMonth(orders), [orders])

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.title} data={kpi} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ReportDonutChart title="Órdenes por Estado" data={getOrdersByStatusChart(orders)} />
        <OrdersTrendChart data={trend} />
      </div>

      <ReportBarChart title="Órdenes por Categoría de Falla" data={getOrdersByCategory(orders)} />

      <ReportExportCatalog filterTab="ordenes" />
    </div>
  )
}
