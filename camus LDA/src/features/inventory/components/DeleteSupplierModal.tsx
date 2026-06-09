import { AlertTriangle } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useInventoryStore } from '@/store/useInventoryStore'
import type { Supplier } from '@/types'

interface DeleteSupplierModalProps {
  supplier: Supplier | null
  open: boolean
  onClose: () => void
}

export function DeleteSupplierModal({ supplier, open, onClose }: DeleteSupplierModalProps) {
  const deleteSupplier = useInventoryStore((s) => s.deleteSupplier)
  const addToast = useInventoryStore((s) => s.addToast)

  if (!supplier) return null

  const handleDelete = () => {
    deleteSupplier(supplier.id)
    addToast(`Proveedor "${supplier.name}" eliminado`, 'info')
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Eliminar Proveedor"
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
        <p className="font-medium text-slate-900">
          ¿Eliminar a <strong>{supplier.name}</strong>?
        </p>
        <p className="text-sm text-slate-500">Esta acción no se puede deshacer.</p>
      </div>
    </Modal>
  )
}
