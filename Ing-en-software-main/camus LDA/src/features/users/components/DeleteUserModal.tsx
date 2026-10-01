import { AlertTriangle, Mail, Shield, User } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useUsersStore } from '@/store/useUsersStore'
import { getRoleName } from '@/data/mock/users'
import { RolePermissionsList } from './RolePermissionsList'
import { useSessionUser } from '@/features/auth/useSessionUser'
import type { SystemUser } from '@/types'

interface DeleteUserModalProps {
  user: SystemUser | null
  open: boolean
  onClose: () => void
}

/**
 * RF64 — CDS 219: Eliminando usuarios del sistema
 */
export function DeleteUserModal({ user, open, onClose }: DeleteUserModalProps) {
  const roles = useUsersStore((s) => s.roles)
  const deleteUser = useUsersStore((s) => s.deleteUser)
  const addToast = useUsersStore((s) => s.addToast)
  const currentUser = useSessionUser()

  if (!user) return null

  const role = roles.find((r) => r.id === user.roleId)

  const handleDelete = () => {
    deleteUser(user.id, {
      id: currentUser.id ?? 'session',
      name: currentUser.name ?? 'Jefe',
    })
    addToast('Usuario eliminado del sistema. Registro guardado en Historial.')
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Eliminar Usuario"
      description="Esta acción eliminará permanentemente al usuario del sistema."
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button className="bg-red-600 hover:bg-red-700" onClick={handleDelete}>
            Eliminar Usuario
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
            <AlertTriangle className="h-7 w-7 text-red-500" />
          </div>
          <p className="text-sm text-slate-600">
            ¿Eliminar a <strong>{user.name}</strong>? Esta acción no se puede deshacer.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-start gap-3 rounded-lg bg-slate-50 px-4 py-3">
            <Mail className="mt-0.5 h-4 w-4 text-slate-400" />
            <div>
              <p className="text-xs font-medium uppercase text-slate-400">Correo</p>
              <p className="text-sm font-medium text-slate-900">{user.email}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-lg bg-slate-50 px-4 py-3">
            <User className="mt-0.5 h-4 w-4 text-slate-400" />
            <div>
              <p className="text-xs font-medium uppercase text-slate-400">Usuario</p>
              <p className="text-sm font-medium text-slate-900">{user.name}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-lg bg-slate-50 px-4 py-3">
            <Shield className="mt-0.5 h-4 w-4 text-slate-400" />
            <div>
              <p className="text-xs font-medium uppercase text-slate-400">Rol</p>
              <p className="text-sm font-medium text-slate-900">
                {getRoleName(roles, user.roleId)}
              </p>
            </div>
          </div>
          <div className="rounded-lg bg-slate-50 px-4 py-3">
            <p className="text-xs font-medium uppercase text-slate-400">Estado</p>
            <Badge label={user.status} context="user" className="mt-1" />
          </div>
        </div>

        <div className="rounded-lg border border-slate-100 bg-white px-4 py-3 text-sm text-slate-600">
          <p>
            <strong>Fecha de creación:</strong> {user.createdAt ?? '—'}
          </p>
        </div>

        {role && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase text-slate-400">Permisos</p>
            <RolePermissionsList permissions={role.permissions} />
          </div>
        )}
      </div>
    </Modal>
  )
}
