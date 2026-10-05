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
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
            ¡Bienvenido, {user.name}!
          </h1>
          <p className="mt-1 text-sm text-slate-500 sm:text-base">
            Resumen general de operaciones
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Última actualización: {formatDateTime(lastUpdated)}
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-end sm:gap-3">
          <div className="w-full sm:min-w-[160px] sm:w-auto">
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Prioridad / urgencia
            </label>
            <Select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as PriorityFilter)}
              aria-label="Filtrar por prioridad"
              className="w-full"
            >
              {PRIORITY_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => setPriorityFilter('Todas')}
            >
              Limpiar filtros
            </Button>
            <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 shadow-sm sm:px-4">
              <Calendar className="h-4 w-4 shrink-0 text-slate-400" />
              <span className="truncate">{today}</span>
            </div>
            <Button
              type="button"
              variant="outline"
              className="col-span-2 w-full sm:col-span-1 sm:w-auto"
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
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-5">
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
