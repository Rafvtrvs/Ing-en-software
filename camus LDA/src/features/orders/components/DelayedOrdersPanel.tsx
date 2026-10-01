import { useCallback, useEffect, useState } from 'react'
import { AlertTriangle, BellRing } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { ordersService } from '@/services/ordersService'
import { useNotificationsStore } from '@/store/useNotificationsStore'
import { useOrdersStore } from '@/store/useOrdersStore'
import type { DelayAction, DelayLevel, DelaysResponse } from '@/types'
import { cn } from '@/utils/cn'

const LEVEL_STYLE: Record<DelayLevel, string> = {
  Alto: 'bg-red-50 text-red-700',
  Medio: 'bg-amber-50 text-amber-700',
  Bajo: 'bg-yellow-50 text-yellow-700',
}

function errorMessage(err: unknown, fallback: string) {
  return (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? fallback
}

/** RF28 — CU-93/94 clasificar y priorizar retrasos · CU-95 notificar · CU-96 gestionar */
export function DelayedOrdersPanel() {
  const addToast = useOrdersStore((s) => s.addToast)
  const syncFromApi = useOrdersStore((s) => s.syncFromApi)
  const addNotification = useNotificationsStore((s) => s.addNotification)

  const [level, setLevel] = useState<DelayLevel | ''>('')
  const [data, setData] = useState<DelaysResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [rescheduling, setRescheduling] = useState<string | null>(null)
  const [newDate, setNewDate] = useState('')

  const load = useCallback(async () => {
    try {
      setData(await ordersService.listDelays(level || undefined))
      setError(null)
    } catch (err) {
      setData(null)
      setError(errorMessage(err, 'No se pudieron cargar los retrasos'))
    }
  }, [level])

  useEffect(() => {
    void load()
  }, [load])

  /** CU-95 */
  const handleNotify = async () => {
    try {
      const notified = await ordersService.notifyDelays()
      if (notified.length === 0) {
        addToast('No hay retrasos altos nuevos por notificar', 'info')
        return
      }
      for (const d of notified) {
        addNotification({
          title: 'Orden con alto retraso',
          message: `${d.id} (${d.client}) lleva ${d.daysLate} días de retraso`,
          type: 'order',
          orderId: d.id,
        })
      }
      addToast(`${notified.length} alerta(s) enviada(s)`)
    } catch (err) {
      addToast(errorMessage(err, 'No se pudo enviar la notificación'), 'error')
    }
  }

  /** CU-96 */
  const handleAction = async (orderId: string, action: DelayAction, dueDate?: string) => {
    try {
      await ordersService.manageDelay(orderId, action, dueDate)
      addToast('Estado de la orden actualizado correctamente')
      setRescheduling(null)
      setNewDate('')
      await Promise.all([load(), syncFromApi()])
    } catch (err) {
      addToast(errorMessage(err, 'No se pudo actualizar la orden'), 'error')
    }
  }

  return (
    <Card className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <div>
            <h2 className="text-base font-semibold text-slate-900">Órdenes retrasadas</h2>
            <p className="text-xs text-slate-500">Ordenadas por nivel de retraso (Alto primero)</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select
            className="w-36"
            value={level}
            onChange={(e) => setLevel(e.target.value as DelayLevel | '')}
            aria-label="Filtrar por nivel de retraso"
          >
            <option value="">Todos los niveles</option>
            <option value="Alto">Alto</option>
            <option value="Medio">Medio</option>
            <option value="Bajo">Bajo</option>
          </Select>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<BellRing className="h-4 w-4" />}
            onClick={() => void handleNotify()}
          >
            Notificar retrasos altos
          </Button>
        </div>
      </div>

      {data && (
        <p className="text-xs text-slate-500">
          Alto: <strong>{data.summary.Alto}</strong> · Medio: <strong>{data.summary.Medio}</strong> ·
          Bajo: <strong>{data.summary.Bajo}</strong>
        </p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {data && data.orders.length === 0 && (
        <p className="text-sm text-slate-500">No hay órdenes retrasadas.</p>
      )}

      <ul className="divide-y divide-slate-100">
        {data?.orders.map((o) => (
          <li key={o.id} className="space-y-2 py-3 first:pt-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {o.id} — {o.client || 'Sin cliente'}
                </p>
                <p className="text-xs text-slate-500">
                  {o.status} · Prioridad {o.priority} · Límite {o.dueDate} · {o.daysLate} días de retraso
                </p>
              </div>
              <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', LEVEL_STYLE[o.level])}>
                {o.level}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {rescheduling === o.id ? (
                <>
                  <Input
                    type="date"
                    className="w-40"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                  />
                  <Button
                    size="sm"
                    disabled={!newDate}
                    onClick={() => void handleAction(o.id, 'reprogramar', newDate)}
                  >
                    Confirmar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setRescheduling(null)}>
                    Cancelar
                  </Button>
                </>
              ) : (
                <>
                  <Button size="sm" variant="outline" onClick={() => setRescheduling(o.id)}>
                    Reprogramar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={o.priority === 'Urgente'}
                    onClick={() => void handleAction(o.id, 'priorizar')}
                  >
                    Priorizar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={o.status === 'En Curso'}
                    onClick={() => void handleAction(o.id, 'intervenir')}
                  >
                    Intervenir
                  </Button>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
    </Card>
  )
}
