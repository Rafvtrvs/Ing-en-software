import { useState } from 'react'
import { UserX } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useUsersStore } from '@/store/useUsersStore'
import { getRoleName } from '@/data/mock/users'
import { RolePermissionsList } from './RolePermissionsList'
import { useSessionUser } from '@/features/auth/useSessionUser'
import { UserAvatar } from '@/components/layout/UserAvatar'
import type { SystemUser } from '@/types'

/**
 * RF64 — CDS 221: Desactivando usuario del sistema
 * Marca Inactivo en Postgres y disabled en Firebase Auth.
 */
export function DeactivateUserModal({
  user,
  open,
  onClose,
}: {
  user: SystemUser | null
  open: boolean
  onClose: () => void
}) {
  const roles = useUsersStore((s) => s.roles)
  const deactivateUserInDb = useUsersStore((s) => s.deactivateUserInDb)
  const addToast = useUsersStore((s) => s.addToast)
  const currentUser = useSessionUser()
  const [loading, setLoading] = useState(false)

  if (!user) return null

  const role = roles.find((r) => r.id === user.roleId)

  const handleDeactivate = async () => {
    if (user.status === 'Inactivo') {
      addToast('El usuario ya está desactivado', 'error')
      return
    }
    setLoading(true)
    try {
      const result = await deactivateUserInDb(user.id, {
        id: currentUser.id ?? 'session',
        name: currentUser.name ?? 'Jefe',
      })
      if (!result.ok) {
        addToast(result.message, 'error')
        return
      }
      addToast('Usuario desactivado en Camus y Firebase.')
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Desactivar Usuario"
      description="El usuario no podrá acceder al sistema hasta ser reactivado."
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            className="bg-amber-600 hover:bg-amber-700"
            leftIcon={<UserX className="h-4 w-4" />}
            onClick={() => void handleDeactivate()}
            disabled={loading}
          >
            {loading ? 'Desactivando…' : 'Desactivar Usuario'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <UserAvatar size="lg" className="h-12 w-12" src={user.avatar} alt={user.name} />
          <div>
            <p className="font-semibold text-slate-900">{user.name}</p>
            <p className="text-sm text-slate-500">{user.email}</p>
            <Badge label={user.status} context="user" className="mt-1" />
          </div>
        </div>
        <div className="grid gap-2 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <p>
            <strong>Fecha creación:</strong> {user.createdAt ?? '—'}
          </p>
          <p>
            <strong>Rol:</strong> {getRoleName(roles, user.roleId)}
          </p>
        </div>
        {role && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase text-slate-400">Permisos</p>
            <RolePermissionsList permissions={role.permissions} />
          </div>
        )}
        <p className="text-sm text-amber-700">
          El usuario cesará funciones en el sistema hasta ser reactivado.
        </p>
      </div>
    </Modal>
  )
}
