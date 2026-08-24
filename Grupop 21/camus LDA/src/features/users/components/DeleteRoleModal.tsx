import { AlertTriangle } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useUsersStore } from '@/store/useUsersStore'
import { countUsersByRole } from '@/data/mock/users'
import type { AppRole } from '@/types'

interface DeleteRoleModalProps {
  role: AppRole | null
  open: boolean
  onClose: () => void
}

export function DeleteRoleModal({ role, open, onClose }: DeleteRoleModalProps) {
  const users = useUsersStore((s) => s.users)
  const deleteRole = useUsersStore((s) => s.deleteRole)
  const addToast = useUsersStore((s) => s.addToast)

  if (!role) return null

  const userCount = countUsersByRole(users, role.id)
  const canDelete = !role.isSystem && userCount === 0

  const handleDelete = () => {
    const ok = deleteRole(role.id)
    if (ok) {
      addToast(`Rol "${role.name}" eliminado`, 'info')
      onClose()
    } else if (role.isSystem) {
      addToast('Los roles de sistema no se pueden eliminar', 'error')
    } else {
      addToast('No se puede eliminar: hay usuarios asignados a este rol', 'error')
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Eliminar Rol"
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            className="bg-red-600 hover:bg-red-700"
            onClick={handleDelete}
            disabled={!canDelete}
          >
            Eliminar
          </Button>
        </>
      }
    >
      <div className="flex flex-col items-center gap-4 py-2 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
          <AlertTriangle className="h-7 w-7 text-red-500" />
        </div>
        {role.isSystem ? (
          <p className="text-sm text-slate-600">
            El rol <strong>{role.name}</strong> es un rol de sistema y no puede eliminarse.
          </p>
        ) : userCount > 0 ? (
          <p className="text-sm text-slate-600">
            El rol <strong>{role.name}</strong> tiene {userCount} usuario(s) asignado(s).
            Reasígnalos antes de eliminar.
          </p>
        ) : (
          <p className="text-sm text-slate-600">
            ¿Eliminar el rol <strong>{role.name}</strong>? Esta acción no se puede deshacer.
          </p>
        )}
      </div>
    </Modal>
  )
}
