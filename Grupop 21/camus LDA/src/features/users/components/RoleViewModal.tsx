import { Pencil, Shield, Users } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useUsersStore } from '@/store/useUsersStore'
import { countUsersByRole } from '@/data/mock/users'
import { RolePermissionsList } from './RolePermissionsList'
import type { AppRole } from '@/types'

interface RoleViewModalProps {
  role: AppRole | null
  open: boolean
  onClose: () => void
}

export function RoleViewModal({ role, open, onClose }: RoleViewModalProps) {
  const users = useUsersStore((s) => s.users)
  const openRoleEditModal = useUsersStore((s) => s.openRoleEditModal)

  if (!role) return null

  const userCount = countUsersByRole(users, role.id)

  const handleEdit = () => {
    onClose()
    openRoleEditModal(role)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Detalle del Rol"
      description="Permisos y usuarios asignados a este perfil."
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          <Button leftIcon={<Pencil className="h-4 w-4" />} onClick={handleEdit}>
            Editar Rol
          </Button>
        </>
      }
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">{role.name}</h3>
            {role.isSystem && (
              <span className="text-xs font-medium text-primary">Rol de sistema</span>
            )}
          </div>
        </div>
        <Badge label={role.status} context="client" />
      </div>

      <p className="mb-4 text-sm text-slate-600">{role.description}</p>

      <div className="mb-6 flex items-center gap-2 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-700">
        <Users className="h-4 w-4 text-slate-400" />
        <span>
          <strong>{userCount}</strong> usuario{userCount !== 1 ? 's' : ''} con este rol
        </span>
      </div>

      <h4 className="mb-3 text-sm font-semibold text-slate-900">Permisos asignados</h4>
      <RolePermissionsList permissions={role.permissions} />
    </Modal>
  )
}
