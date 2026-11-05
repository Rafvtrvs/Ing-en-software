import { useEffect, useMemo } from 'react'
import { AlertTriangle, Boxes, Package } from 'lucide-react'
import { KpiCard } from '@/components/ui/KpiCard'
import type { KpiData, Product } from '@/types'
import { useInventoryStore } from '@/store/useInventoryStore'
import { useOrdersStore } from '@/store/useOrdersStore'
import { isConsumableStockCategory } from '@/features/inventory/utils/stockCategories'
import { computeStockStatus } from '@/features/inventory/utils/inventoryStatus'
import {
  getInventoryStatusChart,
  getMostUsedInventoryProducts,
} from '@/features/reports/utils/reportStats'
import { ReportDonutChart } from './ReportDonutChart'
import { ReportBarChart } from './ReportBarChart'
import { CriticalStockReportTable } from './CriticalStockReportTable'
import { ReportExportCatalog } from './ReportExportCatalog'

function withLiveStatus(product: Product): Product {
  return {
    ...product,
    status: computeStockStatus(
      product.currentStock,
      product.minStock,
      product.category,
    ),
  }
}

export function InventoryReportPanel() {
  const productsRaw = useInventoryStore((s) => s.products)
  const movements = useInventoryStore((s) => s.movements)
  const syncProductsFromApi = useInventoryStore((s) => s.syncProductsFromApi)
  const syncMovementsFromApi = useInventoryStore((s) => s.syncMovementsFromApi)
  const orders = useOrdersStore((s) => s.orders)
  const syncOrders = useOrdersStore((s) => s.syncFromApi)

  useEffect(() => {
    void Promise.all([
      syncProductsFromApi(),
      syncMovementsFromApi(),
      syncOrders(),
    ])
  }, [syncProductsFromApi, syncMovementsFromApi, syncOrders])

  const products = useMemo(
    () => productsRaw.map(withLiveStatus),
    [productsRaw],
  )

  const consumables = useMemo(
    () => products.filter((p) => isConsumableStockCategory(p.category)),
    [products],
  )

  const ok = consumables.filter((p) => p.status === 'Ok').length
  const low = consumables.filter((p) => p.status === 'Bajo').length
  const critical = consumables.filter((p) => p.status === 'Crítico').length

  const kpis: KpiData[] = [
    {
      title: 'Total Productos',
      value: String(products.length),
      trend: 'Catálogo en PostgreSQL',
      trendDirection: 'up',
      icon: Package,
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
    },
    {
      title: 'Stock Ok',
      value: String(ok),
      trend: `${consumables.length ? Math.round((ok / consumables.length) * 100) : 0}% saludable`,
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

  const usedData = useMemo(
    () =>
      getMostUsedInventoryProducts(orders, products, movements).map((p) => ({
        name: p.name.length > 20 ? `${p.name.slice(0, 20)}…` : p.name,
        value: p.value,
      })),
    [orders, products, movements],
  )

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
