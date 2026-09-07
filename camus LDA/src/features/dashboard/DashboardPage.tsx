import { useMemo, useState } from 'react'
import { Calendar, RefreshCw } from 'lucide-react'
import { KpiCard } from '@/components/ui/KpiCard'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { formatDate, formatDateTime } from '@/utils/formatters'
import { useAppStore } from '@/store/useAppStore'
import { useOrdersStore } from '@/store/useOrdersStore'
import { useBillingStore } from '@/store/useBillingStore'
import { useInventoryStore } from '@/store/useInventoryStore'
import { mockEquipment } from '@/data/mock/equipment'
import { getDashboardKpis } from './utils/getDashboardKpis'
import {
  filterOrdersByPriority,
  type PriorityFilter,
} from './utils/dashboardHelpers'
import { OrdersByStatusChart } from './components/OrdersByStatusChart'
import { OrdersByMonthChart } from './components/OrdersByMonthChart'
import { OrdersByCategoryChart } from './components/OrdersByCategoryChart'
import { RecentOrdersTable } from './components/RecentOrdersTable'
import { CriticalInventoryTable } from './components/CriticalInventoryTable'
import { FinancialIncomeBlock } from './components/FinancialIncomeBlock'
import { AvailabilityBlock } from './components/AvailabilityBlock'
import { OverdueOrdersAlert } from './components/OverdueOrdersAlert'
import { QuickActions } from './components/QuickActions'

const PRIORITY_OPTIONS: PriorityFilter[] = ['Todas', 'Baja', 'Media', 'Alta']

export function DashboardPage() {
  const user = useAppStore((s) => s.user)
  const orders = useOrdersStore((s) => s.orders)
  const syncFromApi = useOrdersStore((s) => s.syncFromApi)
  const invoices = useBillingStore((s) => s.invoices)
  const payments = useBillingStore((s) => s.payments)
  const products = useInventoryStore((s) => s.products)

  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('Todas')
  const [lastUpdated, setLastUpdated] = useState(() => new Date())
  const [refreshing, setRefreshing] = useState(false)
  const [refreshTick, setRefreshTick] = useState(0)

  const filteredOrders = useMemo(
    () => filterOrdersByPriority(orders, priorityFilter),
    [orders, priorityFilter, refreshTick],
  )

  const today = formatDate(new Date())
  const kpis = getDashboardKpis(filteredOrders, invoices)

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await syncFromApi()
    } finally {
      setLastUpdated(new Date())
      setRefreshTick((t) => t + 1)
      setRefreshing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            ¡Bienvenido, {user.name}!
          </h1>
          <p className="mt-1 text-slate-500">Resumen general de operaciones</p>
          <p className="mt-1 text-xs text-slate-400">
            Última actualización: {formatDateTime(lastUpdated)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-[160px]">
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Prioridad / urgencia
            </label>
            <Select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as PriorityFilter)}
              aria-label="Filtrar por prioridad"
            >
              {PRIORITY_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex items-center gap-2 self-end rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm">
            <Calendar className="h-4 w-4 text-slate-400" />
            {today}
          </div>
          <Button
            type="button"
            variant="outline"
            className="self-end"
            leftIcon={
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            }
            onClick={() => void handleRefresh()}
            disabled={refreshing}
          >
            Actualizar panel
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.title} data={kpi} />
        ))}
      </div>

      <OverdueOrdersAlert orders={filteredOrders} />

      <div className="grid gap-6 lg:grid-cols-2">
        <FinancialIncomeBlock invoices={invoices} payments={payments} />
        <AvailabilityBlock products={products} equipment={mockEquipment} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <OrdersByStatusChart orders={filteredOrders} />
        <OrdersByMonthChart orders={filteredOrders} />
        <OrdersByCategoryChart orders={filteredOrders} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <RecentOrdersTable orders={filteredOrders} />
        <CriticalInventoryTable products={products} />
      </div>

      <QuickActions />
    </div>
  )
}
