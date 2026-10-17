import { useEffect, useState, type FormEvent } from 'react'
import { CalendarClock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { FormGrid } from '@/components/ui/FormGrid'
import { Input } from '@/components/ui/Input'
import { useOrdersStore } from '@/store/useOrdersStore'
import {
  calcDurationHours,
  toInputDate,
  validateServiceTimeSequence,
} from '@/features/orders/utils/orderDates'
import type { WorkOrder } from '@/types'

/** CU-152 / 153 / 154: fechas inicio, término y duración */
export function OrderDatesPanel({
  order,
  canEdit = true,
}: {
  order: WorkOrder
  canEdit?: boolean
}) {
  const setOrderDates = useOrdersStore((s) => s.setOrderDates)
  const liveOrder = useOrdersStore(
    (s) => s.orders.find((item) => item.id === order.id) ?? order,
  )
  const clock = useOrdersStore((s) => s.serviceClocks[order.id])
  const startedAt = liveOrder.serviceStartedAt ?? clock?.serviceStartedAt
  const endedAt = liveOrder.serviceEndedAt ?? clock?.serviceEndedAt
  const signature = liveOrder.clientSignature ?? clock?.clientSignature
  const startedLabel = startedAt
    ? new Date(startedAt).toLocaleString('es-CL')
    : toInputDate(clock?.startDate ?? liveOrder.startDate)
  const locked = Boolean(
    startedAt ||
      ((liveOrder.status === 'En Curso' ||
        liveOrder.status === 'Completada' ||
        liveOrder.status === 'Abonado') &&
        startedLabel),
  )
  const [startDate, setStartDate] = useState(
    toInputDate(clock?.startDate ?? order.startDate),
  )
  const [endDate, setEndDate] = useState(toInputDate(order.endDate))
  const [durationHours, setDurationHours] = useState(
    order.durationHours != null ? String(order.durationHours) : '',
  )
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setStartDate(toInputDate(clock?.startDate ?? liveOrder.startDate))
    setEndDate(toInputDate(clock?.endDate ?? liveOrder.endDate))
    const hours = clock?.durationHours ?? liveOrder.durationHours
    setDurationHours(hours != null ? String(hours) : '')
  }, [
    liveOrder.id,
    liveOrder.startDate,
    liveOrder.endDate,
    liveOrder.durationHours,
    clock?.startDate,
    clock?.endDate,
    clock?.durationHours,
  ])

  useEffect(() => {
    const calc = calcDurationHours(startDate, endDate)
    if (calc !== undefined) setDurationHours(String(calc))
  }, [startDate, endDate])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!canEdit) return
    const sequenceError = validateServiceTimeSequence(startDate, endDate)
    if (sequenceError) {
      setError(sequenceError)
      return
    }
    if (locked && reason.trim().length < 5) {
      setError('Indica el motivo de la corrección (mínimo 5 caracteres)')
      return
    }
    setError(null)
    const hours = Number(durationHours)
    const result = setOrderDates(order.id, {
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      durationHours: Number.isFinite(hours) ? hours : undefined,
      timeCorrectionNote: reason.trim() || undefined,
    })
    if (!result.ok) setError(result.message ?? 'No se pudieron guardar los tiempos')
    else setReason('')
  }

  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <CalendarClock className="h-4 w-4 text-slate-400" />
        <div>
          <p className="text-sm font-semibold text-slate-900">
            Fechas y duración
          </p>
          <p className="text-xs text-slate-500">
            Inicio, término y horas de trabajo
          </p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        {locked && startedLabel && (
          <div className="rounded-lg border border-slate-300 bg-slate-100 px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Inicio de servicio bloqueado
            </p>
            <p className="mt-1 text-sm font-medium text-slate-900">{startedLabel}</p>
            {endedAt && (
              <p className="mt-1 text-xs text-slate-600">
                Término: {new Date(endedAt).toLocaleString('es-CL')}
                {signature ? ` · Firma: ${signature}` : ''}
              </p>
            )}
          </div>
        )}
        <FormGrid cols={3}>
          <FormField label="Fecha inicio" htmlFor={`start-${order.id}`}>
            <Input
              id={`start-${order.id}`}
              type="date"
              value={startDate}
              disabled={!canEdit}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </FormField>
          <FormField label="Fecha término" htmlFor={`end-${order.id}`}>
            <Input
              id={`end-${order.id}`}
              type="date"
              value={endDate}
              disabled={!canEdit}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </FormField>
          <FormField label="Duración (horas)" htmlFor={`dur-${order.id}`}>
            <Input
              id={`dur-${order.id}`}
              type="number"
              min={0}
              step={0.5}
              value={durationHours}
              disabled={!canEdit}
              onChange={(e) => setDurationHours(e.target.value)}
            />
          </FormField>
        </FormGrid>
        {canEdit && locked && (
          <FormField label="Motivo de la corrección" htmlFor={`reason-${order.id}`}>
            <Input
              id={`reason-${order.id}`}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ej. desfase respecto al reporte físico"
            />
          </FormField>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {canEdit && (
          <Button type="submit">Guardar fechas</Button>
        )}
      </form>
    </div>
  )
}
