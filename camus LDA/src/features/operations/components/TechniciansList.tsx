import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ROUTES } from '@/constants/routes'
import { UserAvatar } from '@/components/layout/UserAvatar'
import { cn } from '@/utils/cn'
import { useUsersStore } from '@/store/useUsersStore'
import { useOrdersStore } from '@/store/useOrdersStore'
import { buildFieldTechniciansFromSystem } from '@/features/operations/utils/fieldTechnicians'

export function TechniciansList() {
  const users = useUsersStore((s) => s.users)
  const roles = useUsersStore((s) => s.roles)
  const syncUsers = useUsersStore((s) => s.syncFromApi)
  const orders = useOrdersStore((s) => s.orders)
  const syncOrders = useOrdersStore((s) => s.syncFromApi)

  useEffect(() => {
    void syncUsers()
    void syncOrders()
  }, [syncUsers, syncOrders])

  const technicians = useMemo(
    () => buildFieldTechniciansFromSystem(users, roles, orders),
    [users, roles, orders],
  )

  return (
    <Card>
      <CardHeader
        title="Técnicos en Terreno"
        action={
          <Link to={ROUTES.USUARIOS} className="text-xs font-medium text-primary hover:underline">
            Ver usuarios
          </Link>
        }
      />
      {technicians.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500">
          No hay técnicos u operadores activos en el sistema. Regístralos en Usuarios
          con rol de campo.
        </p>
      ) : (
        <ul className="divide-y divide-slate-50">
          {technicians.map((tech) => {
            const user = users.find((u) => u.id === tech.id)
            return (
              <li key={tech.id} className="flex gap-3 py-3.5 first:pt-0">
                <UserAvatar src={user?.avatar} alt={tech.name} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-slate-900">{tech.name}</p>
                    <Badge label={tech.status} context="field" />
                  </div>
                  <p className="mt-0.5 truncate text-xs text-slate-500">{tech.address}</p>
                  <p className="text-xs font-medium text-primary">{tech.orderId}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${tech.progress}%` }}
                      />
                    </div>
                    <span className={cn('text-xs font-semibold tabular-nums text-slate-600')}>
                      {tech.progress}%
                    </span>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}
