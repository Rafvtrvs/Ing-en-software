import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, Shield, User } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { useUsersStore } from '@/store/useUsersStore'
import { useSessionUser } from '@/features/auth/useSessionUser'
import { getRoleName } from '@/data/mock/users'
import { RolePermissionsList } from './RolePermissionsList'
import type { SystemUser } from '@/types'

interface AssignRoleModalProps {
  user: SystemUser | null
  open: boolean
  onClose: () => void
}

/**
 * RF65 — CDS 224: Asignando rol a usuario
 * RF65 — CDS 225: Consultando roles y permisos (vista previa al confirmar)
 */
export function AssignRoleModal({ user, open, onClose }: AssignRoleModalProps) {
  const roles = useUsersStore((s) => s.roles)
  const assignRoleToUser = useUsersStore((s) => s.assignRoleToUser)
  const addToast = useUsersStore((s) => s.addToast)
  const currentUser = useSessionUser()

  const activeRoles = useMemo(
    () => roles.filter((r) => r.status === 'Activo'),
    [roles],
  )

  const [selectedRoleId, setSelectedRoleId] = useState('')

  useEffect(() => {
    if (!open || !user) return
    setSelectedRoleId(user.roleId)
  }, [open, user])

  if (!user) return null

  const currentRole = roles.find((r) => r.id === user.roleId)
  const selectedRole = roles.find((r) => r.id === selectedRoleId)
  const isSameRole = selectedRoleId === user.roleId
  const userInactive = user.status !== 'Activo'

  const handleConfirm = () => {
    if (!selectedRoleId) {
      addToast('Selecciona un rol para asignar', 'error')
      return
    }
    if (isSameRole) {
      addToast('El usuario ya tiene ese rol asignado', 'info')
      return
    }
    const result = assignRoleToUser(user.id, selectedRoleId, {
      id: currentUser.id ?? 'session',
      name: currentUser.name ?? 'Jefe',
    })
    if (!result.ok) {
      addToast(result.message, 'error')
      return
    }
    addToast(`Rol "${selectedRole?.name}" asignado a ${user.name}. Ver historial en Asignaciones.`, 'success')
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Asignar Rol a Usuario"
      description="Selecciona un rol y confirma la asignación. Revisa los permisos antes de confirmar."
      size="lg"
      footer={
        <>
          <Button variant="outline" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={!selectedRoleId || isSameRole || userInactive}
            leftIcon={<Shield className="h-4 w-4" />}
          >
            Confirmar Asignación
          </Button>
        </>
      }
    >
      <div className="mb-5 flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
        <img
          src={user.avatar}
          alt=""
          className="h-12 w-12 rounded-full bg-white object-cover ring-2 ring-white"
        />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-900">{user.name}</p>
          <p className="truncate text-sm text-slate-500">{user.email}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge label={user.status} context="user" />
            <span className="inline-flex items-center gap-1 text-xs text-slate-600">
              <User className="h-3 w-3" />
              Rol actual: <strong>{getRoleName(roles, user.roleId)}</strong>
            </span>
          </div>
        </div>
      </div>

      {userInactive && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          Solo se pueden asignar roles a usuarios con estado Activo.
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Nuevo rol <span className="text-red-500">*</span>
          </label>
          <Select
            value={selectedRoleId}
            onChange={(e) => setSelectedRoleId(e.target.value)}
            disabled={userInactive}
          >
            <option value="">Seleccionar rol...</option>
            {activeRoles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
                {r.id === user.roleId ? ' (actual)' : ''}
              </option>
            ))}
          </Select>
        </div>

        {selectedRole && (
          <div className="rounded-xl border border-slate-100 bg-white p-4">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                  Permisos del rol seleccionado
                </p>
                <h4 className="mt-1 text-sm font-semibold text-slate-900">{selectedRole.name}</h4>
                <p className="text-sm text-slate-600">{selectedRole.description}</p>
              </div>
              {selectedRole.isSystem && (
                <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  Sistema
                </span>
              )}
            </div>

            {currentRole && selectedRole.id !== currentRole.id && (
              <p className="mb-3 text-sm text-slate-600">
                El usuario pasará de <strong>{currentRole.name}</strong> a{' '}
                <strong>{selectedRole.name}</strong>. Sus permisos se actualizarán al confirmar.
              </p>
            )}

            <RolePermissionsList permissions={selectedRole.permissions} compact />
          </div>
        )}
      </div>
    </Modal>
  )
}
