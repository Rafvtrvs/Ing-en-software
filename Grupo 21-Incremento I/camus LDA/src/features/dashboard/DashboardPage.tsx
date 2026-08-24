import { Calendar } from 'lucide-react'
import { KpiCard } from '@/components/ui/KpiCard'
import { dashboardKpis } from '@/data/mock/dashboard'
import { formatDate } from '@/utils/formatters'
import { useAppStore } from '@/store/useAppStore'
import { OrdersByStatusChart } from './components/OrdersByStatusChart'
import { OrdersByMonthChart } from './components/OrdersByMonthChart'
import { OrdersByCategoryChart } from './components/OrdersByCategoryChart'
import { RecentOrdersTable } from './components/RecentOrdersTable'
import { CriticalInventoryTable } from './components/CriticalInventoryTable'
import { QuickActions } from './components/QuickActions'

export function DashboardPage() {
  const user = useAppStore((s) => s.user)
  const today = formatDate(new Date())

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            ¡Bienvenido, {user.name}!
          </h1>
          <p className="mt-1 text-slate-500">Resumen general de operaciones</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm">
          <Calendar className="h-4 w-4 text-slate-400" />
          {today}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardKpis.map((kpi) => (
          <KpiCard key={kpi.title} data={kpi} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <OrdersByStatusChart />
        <OrdersByMonthChart />
        <OrdersByCategoryChart />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <RecentOrdersTable />
        <CriticalInventoryTable />
      </div>

      <QuickActions />
    </div>
  )
}
