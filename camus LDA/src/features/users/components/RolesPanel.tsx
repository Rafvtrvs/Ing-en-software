import { Eye, Lock, Pencil, Plus, Shield, Trash2, Upload } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useUsersStore } from '@/store/useUsersStore'
import { countUsersByRole } from '@/data/mock/users'
import { exportRolesToCsv } from '@/features/users/utils/exportUsers'
import { RolePermissionsList } from './RolePermissionsList'
import { cn } from '@/utils/cn'

interface RolesPanelProps {
  onCreateClick?: () => void
}

export function RolesPanel({ onCreateClick }: RolesPanelProps) {
  const roles = useUsersStore((s) => s.roles)
  const users = useUsersStore((s) => s.users)
  const openRoleViewModal = useUsersStore((s) => s.openRoleViewModal)
  const openRoleEditModal = useUsersStore((s) => s.openRoleEditModal)
  const openRoleDeleteModal = useUsersStore((s) => s.openRoleDeleteModal)
  const addToast = useUsersStore((s) => s.addToast)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Roles del Sistema"
          subtitle="Define permisos y accesos por perfil de usuario."
          action={
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Upload className="h-4 w-4" />}
                onClick={() => {
                  exportRolesToCsv(roles)
                  addToast(`${roles.length} roles exportados a CSV`)
                }}
              >
                Exportar
              </Button>
              {onCreateClick && (
                <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={onCreateClick}>
                  Nuevo Rol
                </Button>
              )}
            </div>
          }
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {roles.map((role) => {
            const userCount = countUsersByRole(users, role.id)
            return (
              <div
                key={role.id}
                className={cn(
                  'flex flex-col rounded-xl border border-slate-100 bg-slate-50/50 p-5',
                  role.isSystem && 'border-primary/20 bg-primary/5',
                )}
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {role.isSystem ? (
                      <Shield className="h-5 w-5 text-primary" />
                    ) : (
                      <Lock className="h-5 w-5 text-slate-400" />
                    )}
                    <div>
                      <h4 className="font-semibold text-slate-900">{role.name}</h4>
                      <p className="text-xs text-slate-500">
                        {userCount} usuario{userCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <Badge label={role.status} context="client" />
                </div>

                <p className="mb-4 flex-1 text-sm text-slate-600">{role.description}</p>

                <div className="mb-4 max-h-32 overflow-y-auto rounded-lg bg-white p-3">
                  <RolePermissionsList permissions={role.permissions} compact />
                </div>

                <div className="flex items-center gap-1 border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={() => openRoleViewModal(role)}
                    className="flex flex-1 items-center justify-center gap-1 rounded-lg py-2 text-sm text-slate-500 hover:bg-white hover:text-primary"
                  >
                    <Eye className="h-4 w-4" />
                    Ver
                  </button>
                  <button
                    type="button"
                    onClick={() => openRoleEditModal(role)}
                    className="flex flex-1 items-center justify-center gap-1 rounded-lg py-2 text-sm text-slate-500 hover:bg-white hover:text-primary"
                  >
                    <Pencil className="h-4 w-4" />
                    Editar
                  </button>
                  {!role.isSystem && (
                    <button
                      type="button"
                      onClick={() => openRoleDeleteModal(role)}
                      className="flex flex-1 items-center justify-center gap-1 rounded-lg py-2 text-sm text-slate-500 hover:bg-white hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                      Eliminar
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
