import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, AlertTriangle, Bell, CheckCircle, Info } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { useNotificationsStore } from '@/store/useNotificationsStore'
import { formatDateTime } from '@/utils/formatters'
import { cn } from '@/utils/cn'
import type { AppNotification } from '@/types'

const LIMIT = 8

function alertTone(
  item: AppNotification,
): 'error' | 'warning' | 'info' | 'success' {
  const blob = `${item.title} ${item.message}`.toLowerCase()
  if (
    blob.includes('vencid') ||
    blob.includes('retras') ||
    blob.includes('cancelad') ||
    blob.includes('crític') ||
    blob.includes('critic')
  ) {
    return 'error'
  }
  if (
    blob.includes('comentario') ||
    blob.includes('documento') ||
    blob.includes('foto') ||
    blob.includes('evidencia') ||
    blob.includes('modific')
  ) {
    return 'info'
  }
  if (
    blob.includes('completad') ||
    blob.includes('aprobad') ||
    blob.includes('nueva orden')
  ) {
    return 'success'
  }
  if (blob.includes('estado') || blob.includes('reasign') || blob.includes('reprogram')) {
    return 'warning'
  }
  return 'info'
}

function relativeLabel(iso: string): string {
  const at = Date.parse(iso)
  if (!Number.isFinite(at)) return formatDateTime(iso)
  const diffMs = Date.now() - at
  const mins = Math.floor(diffMs / 60_000)
  if (mins < 1) return 'hace un momento'
  if (mins < 60) return `hace ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `hace ${hours} h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `hace ${days} d`
  return formatDateTime(iso)
}

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

/**
 * Mismo origen que la campanita: solo avisos de tipo `order`
 * (estado, datos, docs, fotos, comentarios, etc.).
 */
export function FieldAlerts() {
  const items = useNotificationsStore((s) => s.items)
  const markAsRead = useNotificationsStore((s) => s.markAsRead)
  const navigate = useNavigate()

  const orderAlerts = useMemo(
    () =>
      items
        .filter((n) => n.type === 'order')
        .slice(0, LIMIT),
    [items],
  )

  const handleSelect = (item: AppNotification) => {
    markAsRead(item.id)
    if (item.link) navigate(item.link)
  }

  return (
    <Card>
      <CardHeader
        title="Alertas y Notificaciones"
        action={
          <span className="flex items-center gap-1 text-xs text-slate-500">
            <Bell className="h-3.5 w-3.5" />
            Campanita · OT
          </span>
        }
      />
      {orderAlerts.length === 0 ? (
        <p className="py-4 text-sm text-slate-500">
          Sin alertas de órdenes aún. Los cambios de OT (estado, datos, documentos,
          fotos, comentarios) aparecerán aquí y en la campanita.
        </p>
      ) : (
        <ul className="space-y-3">
          {orderAlerts.map((alert) => {
            const tone = alertTone(alert)
            const Icon = icons[tone]
            return (
              <li key={alert.id}>
                <button
                  type="button"
                  onClick={() => handleSelect(alert)}
                  className={cn(
                    'flex w-full gap-3 rounded-xl border p-3 text-left transition-colors',
                    alert.read
                      ? 'border-slate-100 bg-white hover:bg-slate-50'
                      : 'border-primary/20 bg-primary/5 hover:bg-primary/10',
                  )}
                >
                  <div className={cn('shrink-0 rounded-lg p-2', styles[tone])}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900">{alert.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{alert.message}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {relativeLabel(alert.createdAt)}
                      {alert.orderId ? ` · ${alert.orderId}` : ''}
                      {!alert.read ? ' · Nuevo' : ''}
                    </p>
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}
