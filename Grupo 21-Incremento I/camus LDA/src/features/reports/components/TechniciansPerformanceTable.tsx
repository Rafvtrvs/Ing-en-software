import { Star } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { technicianPerformance } from '@/data/mock/reports'
import type { TechnicianPerformance } from '@/types'

export function TechniciansPerformanceTable() {
  const columns: Column<TechnicianPerformance>[] = [
    {
      key: 'name',
      header: 'Técnico',
      render: (row) => <span className="font-medium text-slate-900">{row.name}</span>,
    },
    {
      key: 'completedOrders',
      header: 'Completadas',
      render: (row) => (
        <span className="font-semibold text-emerald-700">{row.completedOrders}</span>
      ),
    },
    { key: 'inProgress', header: 'En curso' },
    {
      key: 'avgCompletionDays',
      header: 'Días promedio',
      render: (row) => `${row.avgCompletionDays} días`,
    },
    {
      key: 'rating',
      header: 'Calificación',
      render: (row) => (
        <span className="inline-flex items-center gap-1 font-medium text-amber-600">
          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
          {row.rating.toFixed(1)}
        </span>
      ),
    },
  ]

  return (
    <Card>
      <CardHeader title="Rendimiento por Técnico" />
      <DataTable
        columns={columns}
        data={technicianPerformance}
        keyExtractor={(row) => row.id}
      />
    </Card>
  )
}
