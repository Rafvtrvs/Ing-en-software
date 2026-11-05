import { useState } from 'react'
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
  const [deleting, setDeleting] = useState(false)
  if (!kit) return null

  const handleDelete = async () => {
    setDeleting(true)
    const result = await deleteKit(kit.id)
    setDeleting(false)
    if (!result.ok) {
      addToast(result.message ?? 'No se pudo eliminar el kit', 'error')
      return
    }
    addToast(`Kit "${kit.name}" eliminado`, 'info')
    onClose()
  }

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
            onClick={() => void handleDelete()}
            disabled={deleting}
          >
            Eliminar
          </Button>
        </>
      }
    >
      <div className="py-4 text-center">
        <AlertTriangle className="mx-auto h-10 w-10 text-red-500" />
        <p className="mt-3 font-medium">¿Eliminar {kit.name}?</p>
        <p className="mt-1 text-sm text-slate-500">
          Se quitará el agrupamiento ({kit.items.length} producto
          {kit.items.length === 1 ? '' : 's'}). Los productos del inventario no se borran.
        </p>
      </div>
    </Modal>
  )
}
