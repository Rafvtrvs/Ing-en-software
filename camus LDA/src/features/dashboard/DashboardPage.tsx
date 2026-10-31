import { useEffect, useMemo, useState } from 'react'
import { Calendar, RefreshCw } from 'lucide-react'
import { KpiCard } from '@/components/ui/KpiCard'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { formatDate, formatDateTime } from '@/utils/formatters'
import { useAppStore } from '@/store/useAppStore'
import { useSettingsStore } from '@/store/useSettingsStore'
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
import { UnavailableEquipmentAlert } from './components/UnavailableEquipmentAlert'
import { QuickActions } from './components/QuickActions'

const PRIORITY_OPTIONS: PriorityFilter[] = ['Todas', 'Baja', 'Media', 'Alta']
const FILTER_KEY = 'camus_dashboard_priority_filter'

function readSavedFilter(): PriorityFilter {
  const saved = localStorage.getItem(FILTER_KEY)
  return PRIORITY_OPTIONS.includes(saved as PriorityFilter)
    ? (saved as PriorityFilter)
    : 'Todas'
}

export function DashboardPage() {
  const user = useAppStore((s) => s.user)
  const orders = useOrdersStore((s) => s.orders)
  const syncFromApi = useOrdersStore((s) => s.syncFromApi)
  const invoices = useBillingStore((s) => s.invoices)
  const payments = useBillingStore((s) => s.payments)
  const products = useInventoryStore((s) => s.products)
  const refreshMinutes = useSettingsStore(
    (s) => s.config.system.chartRefreshMinutes ?? 5,
  )

  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>(readSavedFilter)
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

  useEffect(() => {
    localStorage.setItem(FILTER_KEY, priorityFilter)
  }, [priorityFilter])

  useEffect(() => {
    void handleRefresh()
    // Carga inicial desde la API (Postgres) al entrar al dashboard.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!refreshMinutes || refreshMinutes < 1) return
    const timer = window.setInterval(() => {
      void handleRefresh()
    }, refreshMinutes * 60 * 1000)
    return () => window.clearInterval(timer)
    // El intervalo se rearma cuando cambia la configuración guardada.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshMinutes])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl dark:text-slate-100">
            ¡Bienvenido, {user.name}!
          </h1>
          <p className="mt-1 text-sm text-slate-500 sm:text-base">
            Resumen general de operaciones
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Última actualización: {formatDateTime(lastUpdated)}
          </p>
        </div>
        <p className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
          <Calendar className="h-4 w-4 shrink-0 text-primary" />
          <span>{today}</span>
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <label
            htmlFor="dashboard-priority"
            className="shrink-0 text-xs font-medium text-slate-600"
          >
            Prioridad
          </label>
          <Select
            id="dashboard-priority"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as PriorityFilter)}
            aria-label="Filtrar por prioridad"
            className={`w-full sm:max-w-[200px] ${priorityFilter !== 'Todas' ? 'ring-2 ring-primary' : ''}`}
          >
            {PRIORITY_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1 sm:flex-none"
            onClick={() => setPriorityFilter('Todas')}
            disabled={priorityFilter === 'Todas'}
          >
            Restablecer
          </Button>
          <Button
            type="button"
            variant="outline"
            className="flex-1 sm:flex-none"
            leftIcon={
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            }
            onClick={() => void handleRefresh()}
            disabled={refreshing}
          >
            Actualizar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[repeat(auto-fit,minmax(240px,1fr))] sm:gap-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.title} data={kpi} />
        ))}
      </div>

      <OverdueOrdersAlert orders={filteredOrders} />
      <UnavailableEquipmentAlert equipment={mockEquipment} />

      <div className="grid gap-6 lg:grid-cols-2">
        <FinancialIncomeBlock invoices={invoices} payments={payments} />
        <AvailabilityBlock products={products} equipment={mockEquipment} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2 2xl:grid-cols-3">
        <OrdersByStatusChart orders={filteredOrders} />
        <OrdersByMonthChart orders={filteredOrders} />
        <OrdersByCategoryChart orders={filteredOrders} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <RecentOrdersTable orders={filteredOrders} />
        <CriticalInventoryTable products={products} />
      </div>

      <QuickActions />
    </div>
  )
}
