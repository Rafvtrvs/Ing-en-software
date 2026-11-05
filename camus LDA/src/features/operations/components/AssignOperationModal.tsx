import { useEffect, useMemo, useState } from 'react'
import { Users } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { FormField } from '@/components/ui/FormField'
import { useOrdersStore } from '@/store/useOrdersStore'
import { useUsersStore } from '@/store/useUsersStore'
import { getActiveFieldOperators } from '@/features/operations/utils/fieldTechnicians'
import type { OrderOperator, WorkOrder } from '@/types'
import { cn } from '@/utils/cn'

interface AssignOperationModalProps {
  open: boolean
  onClose: () => void
}

function isAssignableOrder(order: WorkOrder): boolean {
  return order.status !== 'Cancelada' && order.status !== 'Completada' && order.status !== 'Abonado'
}

/** Asigna o reasigna técnicos/operadores a una OT desde Operaciones. */
export function AssignOperationModal({ open, onClose }: AssignOperationModalProps) {
  const orders = useOrdersStore((s) => s.orders)
  const assignOperators = useOrdersStore((s) => s.assignOperators)
  const reassignOperators = useOrdersStore((s) => s.reassignOperators)
  const addToast = useOrdersStore((s) => s.addToast)
  const users = useUsersStore((s) => s.users)
  const roles = useUsersStore((s) => s.roles)

  const assignableOrders = useMemo(
    () =>
      orders
        .filter(isAssignableOrder)
        .slice()
        .sort((a, b) => b.id.localeCompare(a.id)),
    [orders],
  )

  const technicians = useMemo(
    () => getActiveFieldOperators(users, roles),
    [users, roles],
  )

  const [orderId, setOrderId] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const selectedOrder = assignableOrders.find((o) => o.id === orderId) ?? null
  const hadPrevious = (selectedOrder?.operatorIds?.length ?? 0) > 0

  useEffect(() => {
    if (!open) return
    const first = assignableOrders[0]
    setOrderId(first?.id ?? '')
    setSelected(first?.operatorIds ? [...first.operatorIds] : [])
    setError(null)
  }, [open, assignableOrders])

  useEffect(() => {
    if (!open || !orderId) return
    const order = assignableOrders.find((o) => o.id === orderId)
    setSelected(order?.operatorIds ? [...order.operatorIds] : [])
    setError(null)
  }, [orderId, open, assignableOrders])

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const toOperators = (): OrderOperator[] =>
    selected
      .map((id) => technicians.find((t) => t.id === id) ?? null)
      .filter(Boolean) as OrderOperator[]

  const handleClose = () => {
    setError(null)
    onClose()
  }

  const handleSubmit = () => {
    if (!orderId || !selectedOrder) {
      setError('Selecciona una orden de trabajo')
      return
    }
    if (selected.length === 0) {
      setError('Selecciona al menos un técnico u operador')
      return
    }
    const operators = toOperators()
    if (operators.length === 0) {
      addToast('Solo se puede asignar usuarios con rol técnico/operador', 'error')
      return
    }
    if (hadPrevious) {
      reassignOperators(orderId, operators)
    } else {
      assignOperators(orderId, operators)
    }
    handleClose()
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Asignar Operación"
      description="Elige una OT activa y los técnicos u operadores que la ejecutarán."
      size="md"
      footer={
        <>
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={assignableOrders.length === 0}>
            {hadPrevious ? 'Reasignar' : 'Asignar'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <FormField label="Orden de trabajo" htmlFor="assign-op-order" error={error && !orderId ? error : undefined}>
          <Select
            id="assign-op-order"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            disabled={assignableOrders.length === 0}
          >
            {assignableOrders.length === 0 ? (
              <option value="">No hay OT disponibles</option>
            ) : (
              assignableOrders.map((o) => {
                const assigned =
                  o.operators?.map((op) => op.name).join(', ') ||
                  o.technician ||
                  'Sin asignar'
                return (
                  <option key={o.id} value={o.id}>
                    {o.id} · {o.client} · {o.status} · {assigned}
                  </option>
                )
              })
            )}
          </Select>
        </FormField>

        {selectedOrder && (
          <p className="text-xs text-slate-500">
            {selectedOrder.address}
            {selectedOrder.service ? ` · ${selectedOrder.service}` : ''}
          </p>
        )}

        <div>
          <div className="mb-2 flex items-center gap-2">
            <Users className="h-4 w-4 text-slate-400" />
            <p className="text-sm font-semibold text-slate-900">Técnicos / operadores</p>
          </div>
          {technicians.length === 0 ? (
            <p className="text-sm text-slate-500">
              No hay técnicos activos. Regístralos en Usuarios con rol de terreno.
            </p>
          ) : (
            <ul className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-slate-100 p-2">
              {technicians.map((t) => {
                const checked = selected.includes(t.id)
                return (
                  <li key={t.id}>
                    <label
                      className={cn(
                        'flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm',
                        checked
                          ? 'bg-primary/5 text-slate-900'
                          : 'text-slate-600 hover:bg-slate-50',
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(t.id)}
                        className="rounded border-slate-300 text-primary focus:ring-primary"
                      />
                      {t.name}
                    </label>
                  </li>
                )
              })}
            </ul>
          )}
          {error && selected.length === 0 && orderId ? (
            <p className="mt-1.5 text-xs text-red-600">{error}</p>
          ) : null}
        </div>
      </div>
    </Modal>
  )
}
