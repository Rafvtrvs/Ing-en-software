import { useEffect, useMemo } from 'react'
import { CheckCircle, Star, Timer, Users } from 'lucide-react'
import { KpiCard } from '@/components/ui/KpiCard'
import type { KpiData } from '@/types'
import { useOrdersStore } from '@/store/useOrdersStore'
import { useUsersStore } from '@/store/useUsersStore'
import { buildTechnicianPerformance } from '@/features/reports/utils/technicianPerformance'
import { ReportBarChart } from './ReportBarChart'
import { TechniciansPerformanceTable } from './TechniciansPerformanceTable'
import { ReportExportCatalog } from './ReportExportCatalog'

export function TechniciansReportPanel() {
  const orders = useOrdersStore((s) => s.orders)
  const syncOrders = useOrdersStore((s) => s.syncFromApi)
  const users = useUsersStore((s) => s.users)
  const roles = useUsersStore((s) => s.roles)
  const syncUsers = useUsersStore((s) => s.syncFromApi)

  useEffect(() => {
    void syncUsers()
    void syncOrders()
  }, [syncUsers, syncOrders])

  const technicians = useMemo(
    () => buildTechnicianPerformance(users, roles, orders),
    [users, roles, orders],
  )

  const totalCompleted = technicians.reduce((s, t) => s + t.completedOrders, 0)
  const totalInProgress = technicians.reduce((s, t) => s + t.inProgress, 0)
  const avgRating =
    technicians.length === 0
      ? 0
      : technicians.reduce((s, t) => s + t.rating, 0) / technicians.length
  const avgDays =
    technicians.length === 0
      ? 0
      : technicians.reduce((s, t) => s + t.avgCompletionDays, 0) / technicians.length

  const kpis: KpiData[] = [
    {
      title: 'Técnicos Activos',
      value: String(technicians.length),
      trend: 'Registrados en el sistema',
      trendDirection: technicians.length > 0 ? 'up' : 'down',
      icon: Users,
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
    },
    {
      title: 'Órdenes Completadas',
      value: String(totalCompleted),
      trend: 'Asignadas a técnicos',
      trendDirection: 'up',
      icon: CheckCircle,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
    },
    {
      title: 'En Curso',
      value: String(totalInProgress),
      trend: 'Asignadas ahora',
      trendDirection: 'up',
      icon: Timer,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
    },
    {
      title: 'Índice de cierre',
      value: avgRating.toFixed(1),
      trend: `${avgDays.toFixed(1)} días promedio`,
      trendDirection: 'up',
      icon: Star,
      iconBg: 'bg-violet-50',
      iconColor: 'text-violet-600',
    },
  ]

  const chartData = technicians.map((t) => ({
    name: t.name.split(' ')[0],
    value: t.completedOrders,
  }))

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.title} data={kpi} />
        ))}
      </div>

      {technicians.length === 0 ? (
        <p className="rounded-xl border border-slate-100 bg-white p-4 text-sm text-slate-500">
          No hay técnicos u operadores activos en el sistema, o aún no se sincronizan los datos.
        </p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <ReportBarChart
            title="Órdenes Completadas por Técnico"
            data={chartData}
            color="#7c3aed"
            layout="horizontal"
            valueLabel="Órdenes"
          />
          <TechniciansPerformanceTable technicians={technicians} />
        </div>
      )}

      <ReportExportCatalog filterTab="tecnicos" />
    </div>
  )
}
