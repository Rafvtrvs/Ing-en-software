import { AlertCircle, AlertTriangle, CheckCircle, Info } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { fieldAlerts } from '@/data/mock/operations'
import { cn } from '@/utils/cn'

const icons = {
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
  success: CheckCircle,
}

const styles = {
  error: 'text-red-500 bg-red-50',
  warning: 'text-amber-600 bg-amber-50',
  info: 'text-blue-500 bg-blue-50',
  success: 'text-emerald-600 bg-emerald-50',
}

export function FieldAlerts() {
  return (
    <Card>
      <CardHeader title="Alertas y Notificaciones" />
      <ul className="space-y-3">
        {fieldAlerts.map((alert) => {
          const Icon = icons[alert.type]
          return (
            <li
              key={alert.id}
              className="flex gap-3 rounded-xl border border-slate-100 p-3"
            >
              <div className={cn('rounded-lg p-2', styles[alert.type])}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900">{alert.title}</p>
                <p className="mt-0.5 text-xs text-slate-500">{alert.description}</p>
                <p className="mt-1 text-xs text-slate-400">{alert.time}</p>
              </div>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
