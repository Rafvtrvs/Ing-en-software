import { AlertTriangle } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useInventoryStore } from '@/store/useInventoryStore'
import type { Product } from '@/types'

interface DeleteProductModalProps {
  product: Product | null
  open: boolean
  onClose: () => void
}

export function DeleteProductModal({ product, open, onClose }: DeleteProductModalProps) {
  const deleteProduct = useInventoryStore((s) => s.deleteProduct)
  const addToast = useInventoryStore((s) => s.addToast)

  if (!product) return null

  const handleDelete = () => {
    deleteProduct(product.id)
    addToast(`Producto "${product.name}" eliminado`, 'info')
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Eliminar Producto"
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
          ¿Eliminar <strong>{product.name}</strong> ({product.code})?
        </p>
        <p className="text-sm text-slate-500">Esta acción no se puede deshacer.</p>
      </div>
    </Modal>
  )
}
