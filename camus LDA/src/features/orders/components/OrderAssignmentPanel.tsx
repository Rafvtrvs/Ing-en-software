import { useMemo, useState } from 'react'
import { Users } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useOrdersStore } from '@/store/useOrdersStore'
import { useUsersStore } from '@/store/useUsersStore'
import type { OrderOperator, WorkOrder } from '@/types'
import { cn } from '@/utils/cn'

/** CU-160–164: asignación / reasignación de técnico o cuadrilla */
export function OrderAssignmentPanel({
  order,
  canEdit = true,
}: {
  order: WorkOrder
  canEdit?: boolean
}) {
  const users = useUsersStore((s) => s.users)
  const roles = useUsersStore((s) => s.roles)
  const assignOperators = useOrdersStore((s) => s.assignOperators)
  const reassignOperators = useOrdersStore((s) => s.reassignOperators)
  const addToast = useOrdersStore((s) => s.addToast)

  const technicians = useMemo(() => {
    const techRoleIds = new Set(
      roles
        .filter((r) => {
          const n = r.name.toLowerCase()
          return (
            n.includes('técnico') ||
            n.includes('tecnico') ||
            n.includes('operador') ||
            n.includes('campo')
          )
        })
        .map((r) => r.id),
    )
    return users.filter(
      (u) => u.status === 'Activo' && techRoleIds.has(u.roleId),
    )
  }, [users, roles])

  const [selected, setSelected] = useState<string[]>(
    order.operatorIds ?? [],
  )

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const toOperators = (): OrderOperator[] =>
    selected
      .map((id) => {
        const u = technicians.find((t) => t.id === id)
        return u ? { id: u.id, name: u.name } : null
      })
      .filter(Boolean) as OrderOperator[]

  const handleAssign = () => {
    if (!canEdit) {
      addToast('Solo operadores asignados o supervisores pueden modificar', 'error')
      return
    }
    if (selected.length === 0) {
      addToast('Selecciona al menos un técnico/operador', 'error')
      return
    }
    // Validar rol operador (CU-164)
    const invalid = selected.filter(
      (id) => !technicians.some((t) => t.id === id),
    )
    if (invalid.length) {
      addToast('Solo se puede asignar usuarios con rol técnico/operador', 'error')
      return
    }
    const hadPrevious = (order.operatorIds?.length ?? 0) > 0
    if (hadPrevious) {
      reassignOperators(order.id, toOperators())
    } else {
      assignOperators(order.id, toOperators())
    }
  }

  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <Users className="h-4 w-4 text-slate-400" />
        <div>
          <p className="text-sm font-semibold text-slate-900">
            Asignación de técnicos / cuadrilla
          </p>
          <p className="text-xs text-slate-500">
            Asigna o reasigna operadores (revoca permisos previos)
          </p>
        </div>
      </div>

      {technicians.length === 0 ? (
        <p className="text-sm text-slate-500">No hay técnicos activos.</p>
      ) : (
        <ul className="mb-3 max-h-40 space-y-1 overflow-y-auto">
          {technicians.map((t) => {
            const checked = selected.includes(t.id)
            return (
              <li key={t.id}>
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

      <div className="mb-3 flex flex-wrap gap-1">
        {(order.operators?.length
          ? order.operators
          : order.technician
            ? [{ id: 'legacy', name: order.technician }]
            : []
        ).map((op) => (
          <span
            key={op.id}
            className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700"
          >
            {op.name}
          </span>
        ))}
      </div>

      <Button type="button" disabled={!canEdit} onClick={handleAssign}>
        {(order.operatorIds?.length ?? 0) > 0 ? 'Reasignar' : 'Asignar'}
      </Button>
    </div>
  )
}
