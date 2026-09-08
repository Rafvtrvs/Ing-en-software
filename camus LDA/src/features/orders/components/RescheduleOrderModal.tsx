import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, CalendarClock, CheckCircle } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { useOrdersStore } from '@/store/useOrdersStore'
import { useSessionUser } from '@/features/auth/useSessionUser'
import { formatDisplayDate, toInputDate } from '@/features/orders/utils/orderDates'
import { getExecutionDate, validateRescheduleDate } from '@/features/orders/utils/rescheduleValidation'
import { useInventoryStore } from '@/store/useInventoryStore'
import type { OrderRescheduleEvent, WorkOrder } from '@/types'

const EMPTY_RESCHEDULE_HISTORY: OrderRescheduleEvent[] = []

interface RescheduleOrderModalProps {
  order: WorkOrder | null
  open: boolean
  onClose: () => void
}

/**
 * RF66 — CDS 227: Reprogramar fecha de ejecución
 * RF66 — CDS 228: Validación de disponibilidad
 */
export function RescheduleOrderModal({ order, open, onClose }: RescheduleOrderModalProps) {
  const orders = useOrdersStore((s) => s.orders)
  const products = useInventoryStore((s) => s.products)
  const rescheduleOrder = useOrdersStore((s) => s.rescheduleOrder)
  const addToast = useOrdersStore((s) => s.addToast)
  const currentUser = useSessionUser()

  const currentDate = order ? getExecutionDate(order) || toInputDate(order.startDate) : ''
  const [newDate, setNewDate] = useState(currentDate)

  useEffect(() => {
    if (!open || !order) return
    setNewDate(getExecutionDate(order) || toInputDate(order.startDate) || '')
  }, [open, order])

  const validation = useMemo(() => {
    if (!order || !newDate) return { available: false, reasons: [] as string[] }
    return validateRescheduleDate(order, newDate, orders, products)
  }, [order, newDate, orders, products])

  if (!order) return null

  const handleConfirm = () => {
    const result = rescheduleOrder(order.id, newDate, {
      id: currentUser.id ?? 'session',
      name: currentUser.name ?? 'Administrador',
    })
    if (!result.ok) {
      addToast(result.message ?? 'No se pudo reprogramar', 'error')
      return
    }
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Reprogramar orden"
      description="Cambie la fecha de ejecución de la orden de trabajo."
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!newDate || !validation.available || newDate === currentDate}
          >
            Confirmar reprogramación
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-xl bg-slate-50 p-4 text-sm">
          <p>
            <span className="text-slate-500">Orden:</span>{' '}
            <strong>{order.id}</strong>
          </p>
          <p className="mt-1">
            <span className="text-slate-500">Cliente:</span> {order.client}
          </p>
          <p className="mt-1">
            <span className="text-slate-500">Dirección:</span> {order.address}
          </p>
          <p className="mt-2 flex items-center gap-2">
            <Badge label={order.status} context="order" />
            <span className="text-slate-500">
              Fecha actual:{' '}
              <strong className="text-slate-800">
                {currentDate ? formatDisplayDate(currentDate) : 'Sin programar'}
              </strong>
            </span>
          </p>
        </div>

        <div>
          <label htmlFor="new-execution-date" className="mb-1.5 block text-sm font-medium">
            Nueva fecha de ejecución
          </label>
          <Input
            id="new-execution-date"
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
          />
        </div>

        {newDate && (
          <div
            className={
              validation.available
                ? 'rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800'
                : 'rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900'
            }
          >
            <div className="flex items-start gap-2">
              {validation.available ? (
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
              ) : (
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              )}
              <div>
                <p className="font-semibold">
                  {validation.available ? 'Fecha disponible' : 'Fecha no disponible'}
                </p>
                {validation.available ? (
                  <p className="mt-0.5">
                    Recursos disponibles para la fecha seleccionada.
                  </p>
                ) : (
                  <ul className="mt-1 list-inside list-disc">
                    {validation.reasons.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

/**
 * RF66 — CDS 229: Historial de reprogramaciones (solo lectura)
 */
export function OrderRescheduleHistoryPanel({ orderId }: { orderId: string }) {
  const rawHistory = useOrdersStore(
    (s) => s.rescheduleHistoryByOrderId[orderId] ?? EMPTY_RESCHEDULE_HISTORY,
  )
  const history = useMemo(
    () =>
      [...rawHistory].sort(
        (a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime(),
      ),
    [rawHistory],
  )

  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <CalendarClock className="h-4 w-4 text-slate-400" />
        <p className="text-sm font-semibold text-slate-900">Historial de reprogramaciones</p>
      </div>
      {history.length === 0 ? (
        <p className="text-sm text-slate-500">No hay reprogramaciones registradas.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase text-slate-500">
                <th className="px-2 py-2">Fecha anterior</th>
                <th className="px-2 py-2">Nueva fecha</th>
                <th className="px-2 py-2">Usuario</th>
                <th className="px-2 py-2">Fecha de cambio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {history.map((e) => (
                <tr key={e.id}>
                  <td className="px-2 py-2 text-slate-600">
                    {formatDisplayDate(e.previousDate)}
                  </td>
                  <td className="px-2 py-2 font-medium text-slate-900">
                    {formatDisplayDate(e.newDate)}
                  </td>
                  <td className="px-2 py-2 text-slate-600">{e.changedByName}</td>
                  <td className="px-2 py-2 whitespace-nowrap text-slate-600">
                    {formatDisplayDate(e.changedAt.slice(0, 10))}{' '}
                    {e.changedAt.includes('T') ? e.changedAt.slice(11, 16) : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
