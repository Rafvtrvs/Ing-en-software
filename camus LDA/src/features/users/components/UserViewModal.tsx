import { Mail, Pencil, Phone, Shield, User } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useUsersStore } from '@/store/useUsersStore'
import { getRoleName } from '@/data/mock/users'
import { formatLastLogin } from '@/features/users/utils/userFormatters'
import { RolePermissionsList } from './RolePermissionsList'
import type { SystemUser } from '@/types'

interface UserViewModalProps {
  user: SystemUser | null
  open: boolean
  onClose: () => void
}

export function UserViewModal({ user, open, onClose }: UserViewModalProps) {
  const roles = useUsersStore((s) => s.roles)
  const openUserEditModal = useUsersStore((s) => s.openUserEditModal)

  if (!user) return null

  const role = roles.find((r) => r.id === user.roleId)

  const handleEdit = () => {
    onClose()
    openUserEditModal(user)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Detalle del Usuario"
      description="Información y permisos del usuario seleccionado."
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          <Button leftIcon={<Pencil className="h-4 w-4" />} onClick={handleEdit}>
            Editar Usuario
          </Button>
        </>
      }
    >
      <div className="mb-6 flex items-center gap-4">
        <img
          src={user.avatar}
          alt=""
          className="h-16 w-16 rounded-full bg-slate-100 object-cover"
        />
        <div>
          <h3 className="text-xl font-bold text-slate-900">{user.name}</h3>
          <p className="text-sm text-slate-500">{user.email}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge label={user.status} context="user" />
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              <Shield className="h-3 w-3" />
              {getRoleName(roles, user.roleId)}
            </span>
          </div>
        </div>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <div className="flex items-start gap-3 rounded-lg bg-slate-50 px-4 py-3">
          <Phone className="mt-0.5 h-4 w-4 text-slate-400" />
          <div>
            <p className="text-xs font-medium uppercase text-slate-400">Teléfono</p>
            <p className="text-sm font-medium text-slate-900">{user.phone}</p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-lg bg-slate-50 px-4 py-3">
          <Mail className="mt-0.5 h-4 w-4 text-slate-400" />
          <div>
            <p className="text-xs font-medium uppercase text-slate-400">Email</p>
            <p className="text-sm font-medium text-slate-900">{user.email}</p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-lg bg-slate-50 px-4 py-3 sm:col-span-2">
          <User className="mt-0.5 h-4 w-4 text-slate-400" />
          <div>
            <p className="text-xs font-medium uppercase text-slate-400">Último acceso</p>
            <p className="text-sm font-medium text-slate-900">{formatLastLogin(user.lastLogin)}</p>
          </div>
        </div>
      </div>

      {role && (
        <div>
          <h4 className="mb-3 text-sm font-semibold text-slate-900">Permisos del rol</h4>
          <RolePermissionsList permissions={role.permissions} />
        </div>
      )}
    </Modal>
  )
}
