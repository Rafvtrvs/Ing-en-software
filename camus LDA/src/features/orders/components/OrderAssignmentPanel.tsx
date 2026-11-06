import { useEffect, useMemo, useState } from 'react'
import { Users } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useOrdersStore } from '@/store/useOrdersStore'
import { useUsersStore } from '@/store/useUsersStore'
import { isFieldTechRoleName } from '@/features/operations/utils/fieldTechnicians'
import type { OrderOperator, WorkOrder } from '@/types'
import { cn } from '@/utils/cn'

/** CU-160–164: asignación / reasignación de la cuadrilla */
export function OrderAssignmentPanel({
  order,
  canEdit = true,
}: {
  order: WorkOrder
  canEdit?: boolean
}) {
  const users = useUsersStore((s) => s.users)
  const roles = useUsersStore((s) => s.roles)
  const liveOrder = useOrdersStore(
    (s) => s.orders.find((item) => item.id === order.id) ?? order,
  )
  const assignOperators = useOrdersStore((s) => s.assignOperators)
  const addToast = useOrdersStore((s) => s.addToast)

  const technicians = useMemo(() => {
    const techRoleIds = new Set(
      roles.filter((r) => isFieldTechRoleName(r.name)).map((r) => r.id),
    )
    return users.filter(
      (u) => u.status === 'Activo' && techRoleIds.has(u.roleId),
    )
  }, [users, roles])

  const savedKey = (liveOrder.operatorIds ?? []).join(',')
  const [selected, setSelected] = useState<string[]>(
    savedKey ? savedKey.split(',') : [],
  )

  useEffect(() => {
    setSelected(savedKey ? savedKey.split(',') : [])
  }, [liveOrder.id, savedKey])

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    )
  }

  const toOperators = (): OrderOperator[] =>
    selected
      .map((id) => {
        const user = technicians.find((tech) => tech.id === id)
        return user ? { id: user.id, name: user.name } : null
      })
      .filter(Boolean) as OrderOperator[]

  const handleSave = () => {
    if (!canEdit) {
      addToast('Solo operadores asignados o supervisores pueden modificar', 'error')
      return
    }
    const invalid = selected.filter(
      (id) => !technicians.some((tech) => tech.id === id),
    )
    if (invalid.length) {
      addToast('Solo se puede asignar usuarios con rol técnico/operador', 'error')
      return
    }
    assignOperators(liveOrder.id, toOperators())
  }

  const crew =
    liveOrder.operators?.length
      ? liveOrder.operators
      : liveOrder.technician
        ? [{ id: 'legacy', name: liveOrder.technician }]
        : []

  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <Users className="h-4 w-4 text-slate-400" />
        <div>
          <p className="text-sm font-semibold text-slate-900">
            Cuadrilla de la orden
          </p>
          <p className="text-xs text-slate-500">
            Marca o desmarca técnicos y guarda para actualizar la asignación
          </p>
        </div>
      </div>

      {technicians.length === 0 ? (
        <p className="text-sm text-slate-500">No hay técnicos activos.</p>
      ) : (
        <ul className="mb-3 max-h-40 space-y-1 overflow-y-auto">
          {technicians.map((tech) => {
            const checked = selected.includes(tech.id)
            return (
              <li key={tech.id}>
                <label
                  className={cn(
                    'flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm',
                    checked ? 'bg-primary/5 text-slate-900' : 'text-slate-600 hover:bg-slate-50',
                    !canEdit && 'cursor-not-allowed opacity-60',
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={!canEdit}
                    onChange={() => toggle(tech.id)}
                    className="rounded border-slate-300 text-primary focus:ring-primary"
                  />
                  {tech.name}
                </label>
              </li>
            )
          })}
        </ul>
      )}

      <div className="mb-3 flex flex-wrap gap-1">
        {crew.length === 0 ? (
          <span className="text-xs text-slate-500">Sin técnicos asignados</span>
        ) : (
          crew.map((op) => (
            <span
              key={op.id}
              className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700"
            >
              {op.name}
            </span>
          ))
        )}
      </div>

      <Button type="button" disabled={!canEdit} onClick={handleSave}>
        Guardar cuadrilla
      </Button>
    </div>
  )
}
