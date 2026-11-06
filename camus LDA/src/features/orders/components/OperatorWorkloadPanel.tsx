import { useEffect, useMemo } from 'react'
import { Gauge } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { useOrdersStore } from '@/store/useOrdersStore'
import { useUsersStore } from '@/store/useUsersStore'
import {
  getActiveFieldOperators,
  isOrderAssignedTo,
} from '@/features/operations/utils/fieldTechnicians'
import { cn } from '@/utils/cn'

/** CU-163: panel de carga laboral de operadores */
export function OperatorWorkloadPanel() {
  const users = useUsersStore((s) => s.users)
  const roles = useUsersStore((s) => s.roles)
  const syncUsers = useUsersStore((s) => s.syncFromApi)
  const orders = useOrdersStore((s) => s.orders)

  useEffect(() => {
    void syncUsers()
  }, [syncUsers])

  const technicians = useMemo(
    () => getActiveFieldOperators(users, roles),
    [users, roles],
  )

  const workload = useMemo(
    () =>
      technicians.map((tech) => {
        const assigned = orders.filter((order) =>
          isOrderAssignedTo(order, tech.id, tech.name),
        )
        const active = assigned.filter(
          (order) => order.status === 'Pendiente' || order.status === 'En Curso',
        )
        return {
          operatorId: tech.id,
          name: tech.name,
          activeOrders: active.length,
          pendingOrders: assigned.filter((order) => order.status === 'Pendiente').length,
          inProgressOrders: assigned.filter((order) => order.status === 'En Curso').length,
          totalAssigned: assigned.length,
        }
      }),
    [orders, technicians],
  )
  const maxActive = Math.max(1, ...workload.map((w) => w.activeOrders))

  return (
    <Card>
      <CardHeader
        title="Carga laboral de operadores"
        subtitle="Órdenes activas (Pendiente / En Curso) por técnico"
      />
      {workload.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500">
          No hay técnicos activos.
        </p>
      ) : (
        <ul className="space-y-3">
          {workload.map((w) => {
            const pct = Math.round((w.activeOrders / maxActive) * 100)
            return (
              <li key={w.operatorId}>
                <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                  <span className="flex items-center gap-1.5 font-medium text-slate-800">
                    <Gauge className="h-3.5 w-3.5 text-slate-400" />
                    {w.name}
                  </span>
                  <span className="text-xs text-slate-500">
                    {w.activeOrders} activas · {w.totalAssigned} total
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      w.activeOrders >= 3
                        ? 'bg-red-500'
                        : w.activeOrders === 2
                          ? 'bg-amber-500'
                          : 'bg-emerald-500',
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  Pendientes: {w.pendingOrders} · En curso: {w.inProgressOrders}
                </p>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}
