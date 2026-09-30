import { AlertTriangle } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useUsersStore } from '@/store/useUsersStore'
import type { SystemUser } from '@/types'

/** RF70 — CU-240: Desvincular correo electrónico de usuario */
export function UnlinkUserEmailModal({
  user,
  open,
  onClose,
}: {
  user: SystemUser | null
  open: boolean
  onClose: () => void
}) {
  const unlinkUserEmail = useUsersStore((s) => s.unlinkUserEmail)
  const addToast = useUsersStore((s) => s.addToast)

  if (!user) return null

  const handleConfirm = () => {
    const result = unlinkUserEmail(user.id)
    if (!result.ok) {
      addToast(result.message ?? 'No fue posible desvincular el correo', 'error')
      return
    }
    addToast('Correo desvinculado correctamente')
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Desvincular correo electrónico"
      description="Esta acción quitará la vinculación del correo con el usuario seleccionado."
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button className="bg-red-600 hover:bg-red-700" onClick={handleConfirm}>
            Confirmar desvinculación
          </Button>
        </>
      }
    >
      <div className="flex flex-col items-center gap-3 py-2 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
          <AlertTriangle className="h-7 w-7 text-red-500" />
        </div>
        <p className="text-sm text-slate-600">
          Se desvinculará el correo <strong>{user.email}</strong> del usuario{' '}
          <strong>{user.name}</strong>.
        </p>
      </div>
    </Modal>
  )
}
