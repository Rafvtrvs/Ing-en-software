import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { fieldSchedule } from '@/data/mock/operations'
import { cn } from '@/utils/cn'

const statusColors: Record<string, string> = {
  Completada: 'border-l-emerald-500 bg-emerald-50/50',
  'En Curso': 'border-l-amber-500 bg-amber-50/50',
  'En Ruta': 'border-l-blue-500 bg-blue-50/30',
  Retrasada: 'border-l-red-500 bg-red-50/50',
  'En Espera': 'border-l-amber-400 bg-amber-50/30',
}

export function DaySchedule() {
  return (
    <Card>
      <CardHeader title="Agenda del Día" />
      <div className="space-y-2">
        {fieldSchedule.map((item) => (
          <div
            key={item.id}
            className={cn(
              'rounded-lg border-l-4 px-4 py-3',
              statusColors[item.status] ?? 'border-l-slate-300 bg-slate-50',
            )}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-500">
                {item.start} – {item.end}
              </span>
              <Badge label={item.status} context="field" />
            </div>
            <p className="mt-1 text-sm font-semibold text-slate-900">{item.orderId}</p>
            <p className="text-sm text-slate-600">{item.service}</p>
            <p className="text-xs text-slate-500">{item.address}</p>
          </div>
        ))}
      </div>
      <Link
        to="#"
        onClick={(e) => e.preventDefault()}
        className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
      >
        Ver agenda completa
        <ArrowRight className="h-4 w-4" />
      </Link>
    </Card>
  )
}
