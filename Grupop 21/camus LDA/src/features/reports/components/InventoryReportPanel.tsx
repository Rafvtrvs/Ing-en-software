import { AlertTriangle, Boxes, Package } from 'lucide-react'
import { KpiCard } from '@/components/ui/KpiCard'
import type { KpiData } from '@/types'
import { useInventoryStore } from '@/store/useInventoryStore'
import { getInventoryStatusChart } from '@/features/reports/utils/reportStats'
import { mostUsedProducts } from '@/data/mock/inventory'
import { ReportDonutChart } from './ReportDonutChart'
import { ReportBarChart } from './ReportBarChart'
import { CriticalStockReportTable } from './CriticalStockReportTable'
import { ReportExportCatalog } from './ReportExportCatalog'

export function InventoryReportPanel() {
  const products = useInventoryStore((s) => s.products)

  const ok = products.filter((p) => p.status === 'Ok').length
  const low = products.filter((p) => p.status === 'Bajo').length
  const critical = products.filter((p) => p.status === 'Crítico').length

  const kpis: KpiData[] = [
    {
      title: 'Total Productos',
      value: String(products.length),
      trend: 'En catálogo',
      trendDirection: 'up',
      icon: Package,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Stock Ok',
      value: String(ok),
      trend: `${products.length ? Math.round((ok / products.length) * 100) : 0}% saludable`,
      trendDirection: 'up',
      icon: Boxes,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
    },
    {
      title: 'Stock Bajo',
      value: String(low),
      trend: 'Revisar reposición',
      trendDirection: 'down',
      icon: AlertTriangle,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
    },
    {
      title: 'Stock Crítico',
      value: String(critical),
      trend: critical > 0 ? 'Acción urgente' : 'Sin alertas',
      trendDirection: critical > 0 ? 'down' : 'up',
      icon: AlertTriangle,
      iconBg: critical > 0 ? 'bg-red-50' : 'bg-emerald-50',
      iconColor: critical > 0 ? 'text-red-600' : 'text-emerald-600',
    },
  ]

  const usedData = mostUsedProducts.map((p) => ({
    name: p.name.length > 20 ? `${p.name.slice(0, 20)}…` : p.name,
    value: p.value,
  }))

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.title} data={kpi} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ReportDonutChart title="Estado del Inventario" data={getInventoryStatusChart(products)} />
        <ReportBarChart title="Productos Más Utilizados" data={usedData} color="#0d9488" />
      </div>

      <CriticalStockReportTable products={products} />

      <ReportExportCatalog filterTab="inventario" />
    </div>
  )
}
