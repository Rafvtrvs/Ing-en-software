import { CheckCircle, Star, Timer, Users } from 'lucide-react'
import { KpiCard } from '@/components/ui/KpiCard'
import type { KpiData } from '@/types'
import { technicianPerformance } from '@/data/mock/reports'
import { ReportBarChart } from './ReportBarChart'
import { TechniciansPerformanceTable } from './TechniciansPerformanceTable'
import { ReportExportCatalog } from './ReportExportCatalog'

export function TechniciansReportPanel() {
  const totalCompleted = technicianPerformance.reduce((s, t) => s + t.completedOrders, 0)
  const totalInProgress = technicianPerformance.reduce((s, t) => s + t.inProgress, 0)
  const avgRating =
    technicianPerformance.reduce((s, t) => s + t.rating, 0) / technicianPerformance.length
  const avgDays =
    technicianPerformance.reduce((s, t) => s + t.avgCompletionDays, 0) /
    technicianPerformance.length

  const kpis: KpiData[] = [
    {
      title: 'Técnicos Activos',
      value: String(technicianPerformance.length),
      trend: 'En operaciones',
      trendDirection: 'up',
      icon: Users,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Órdenes Completadas',
      value: String(totalCompleted),
      trend: 'En el período',
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
      title: 'Calificación Promedio',
      value: avgRating.toFixed(1),
      trend: `${avgDays.toFixed(1)} días promedio`,
      trendDirection: 'up',
      icon: Star,
      iconBg: 'bg-violet-50',
      iconColor: 'text-violet-600',
    },
  ]

  const chartData = technicianPerformance.map((t) => ({
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

      <div className="grid gap-6 lg:grid-cols-2">
        <ReportBarChart
          title="Órdenes Completadas por Técnico"
          data={chartData}
          color="#7c3aed"
          layout="horizontal"
        />
        <TechniciansPerformanceTable />
      </div>

      <ReportExportCatalog filterTab="tecnicos" />
    </div>
  )
}
