import { useEffect, useState, type FormEvent } from 'react'
import { CalendarClock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { useOrdersStore } from '@/store/useOrdersStore'
import { calcDurationHours, toInputDate } from '@/features/orders/utils/orderDates'
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
  const [startDate, setStartDate] = useState(toInputDate(order.startDate))
  const [endDate, setEndDate] = useState(toInputDate(order.endDate))
  const [durationHours, setDurationHours] = useState(
    order.durationHours != null ? String(order.durationHours) : '',
  )

  useEffect(() => {
    setStartDate(toInputDate(order.startDate))
    setEndDate(toInputDate(order.endDate))
    setDurationHours(
      order.durationHours != null ? String(order.durationHours) : '',
    )
  }, [order.id, order.startDate, order.endDate, order.durationHours])

  useEffect(() => {
    const calc = calcDurationHours(startDate, endDate)
    if (calc !== undefined) setDurationHours(String(calc))
  }, [startDate, endDate])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!canEdit) return
    const hours = Number(durationHours)
    setOrderDates(order.id, {
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      durationHours: Number.isFinite(hours) ? hours : undefined,
    })
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
      <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-3">
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
        {canEdit && (
          <div className="sm:col-span-3">
            <Button type="submit">Guardar fechas</Button>
          </div>
        )}
      </form>
    </div>
  )
}
