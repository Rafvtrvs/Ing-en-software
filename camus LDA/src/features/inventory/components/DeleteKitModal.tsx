import { AlertTriangle } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useInventoryStore } from '@/store/useInventoryStore'
import type { ProductKit } from '@/types'

export function DeleteKitModal({
  kit,
  open,
  onClose,
}: {
  kit: ProductKit | null
  open: boolean
  onClose: () => void
}) {
  const deleteKit = useInventoryStore((s) => s.deleteKit)
  const addToast = useInventoryStore((s) => s.addToast)
  if (!kit) return null

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Eliminar Kit"
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            className="bg-red-600 hover:bg-red-700"
            onClick={() => {
              deleteKit(kit.id)
              addToast(`Kit "${kit.name}" eliminado`, 'info')
              onClose()
            }}
          >
            Eliminar
          </Button>
        </>
      }
    >
      <div className="py-4 text-center">
        <AlertTriangle className="mx-auto h-10 w-10 text-red-500" />
        <p className="mt-3 font-medium">¿Eliminar {kit.name}?</p>
      </div>
    </Modal>
  )
}
