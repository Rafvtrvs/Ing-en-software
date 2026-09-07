import { Calendar } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { upcomingDeadlines } from '@/data/mock/clients'
import { ROUTES } from '@/constants/routes'

export function UpcomingDeadlines() {
  return (
    <Card>
      <CardHeader title="Próximos Vencimientos / Contactos" />
      <ul className="divide-y divide-slate-50">
        {upcomingDeadlines.map((item) => (
          <li key={item.id} className="flex items-start justify-between gap-3 py-3.5 first:pt-0">
            <div className="min-w-0">
              <p className="font-medium text-slate-900">{item.client}</p>
              <p className="mt-0.5 text-sm text-slate-500">{item.reason}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5 text-sm text-slate-600">
              <Calendar className="h-4 w-4 text-slate-400" />
              {item.date}
            </div>
          </li>
        ))}
      </ul>
      <Link
        to={ROUTES.CLIENTES}
        className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
      >
        Ver todos los vencimientos
        <ArrowRight className="h-4 w-4" />
      </Link>
    </Card>
  )
}
