import { Link } from 'react-router-dom'
import { Card, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useOperationsStore } from '@/store/useOperationsStore'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/utils/cn'

export function TechniciansList() {
  const technicians = useOperationsStore((s) => s.technicians)

  return (
    <Card>
      <CardHeader
        title="Técnicos en Terreno"
        action={
          <Link to={ROUTES.ORDENES} className="text-xs font-medium text-primary hover:underline">
            Ver todos
          </Link>
        }
      />
      <ul className="divide-y divide-slate-50">
        {technicians.map((tech) => (
          <li key={tech.id} className="flex gap-3 py-3.5 first:pt-0">
            <img
              src={tech.avatar}
              alt={tech.name}
              className="h-10 w-10 shrink-0 rounded-full bg-slate-100"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-slate-900">{tech.name}</p>
                <Badge label={tech.status} context="field" />
              </div>
              <p className="mt-0.5 truncate text-xs text-slate-500">{tech.address}</p>
              <p className="text-xs font-medium text-primary">{tech.orderId}</p>
              <div className="mt-2 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${tech.progress}%` }}
                  />
                </div>
                <span className={cn('text-xs font-semibold tabular-nums text-slate-600')}>
                  {tech.progress}%
                </span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  )
}
