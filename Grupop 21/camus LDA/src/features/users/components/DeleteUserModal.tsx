import { AlertTriangle } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useUsersStore } from '@/store/useUsersStore'
import type { SystemUser } from '@/types'

interface DeleteUserModalProps {
  user: SystemUser | null
  open: boolean
  onClose: () => void
}

export function DeleteUserModal({ user, open, onClose }: DeleteUserModalProps) {
  const deleteUser = useUsersStore((s) => s.deleteUser)
  const addToast = useUsersStore((s) => s.addToast)

  if (!user) return null

  const handleDelete = () => {
    deleteUser(user.id)
    addToast(`Usuario "${user.name}" eliminado`, 'info')
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Eliminar Usuario"
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button className="bg-red-600 hover:bg-red-700" onClick={handleDelete}>
            Eliminar
          </Button>
        </>
      }
    >
      <div className="flex flex-col items-center gap-4 py-2 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
          <AlertTriangle className="h-7 w-7 text-red-500" />
        </div>
        <p className="text-sm text-slate-600">
          ¿Eliminar a <strong>{user.name}</strong> ({user.email})? Esta acción no se puede
          deshacer.
        </p>
      </div>
    </Modal>
  )
}
