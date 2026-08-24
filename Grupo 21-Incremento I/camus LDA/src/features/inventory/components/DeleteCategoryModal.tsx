import { AlertTriangle } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useInventoryStore } from '@/store/useInventoryStore'
import type { ProductCategory } from '@/types'

interface DeleteCategoryModalProps {
  category: ProductCategory | null
  open: boolean
  onClose: () => void
}

export function DeleteCategoryModal({ category, open, onClose }: DeleteCategoryModalProps) {
  const deleteCategory = useInventoryStore((s) => s.deleteCategory)
  const products = useInventoryStore((s) => s.products)
  const addToast = useInventoryStore((s) => s.addToast)

  if (!category) return null

  const productCount = products.filter((p) => p.category === category.name).length

  const handleDelete = () => {
    const ok = deleteCategory(category.id)
    if (ok) {
      addToast(`Categoría "${category.name}" eliminada`, 'info')
      onClose()
    } else {
      addToast(
        `No se puede eliminar: ${productCount} producto(s) usan esta categoría`,
        'error',
      )
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Eliminar Categoría"
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            className="bg-red-600 hover:bg-red-700"
            onClick={handleDelete}
            disabled={productCount > 0}
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
        <p className="font-medium text-slate-900">
          ¿Eliminar la categoría <strong>{category.name}</strong>?
        </p>
        {productCount > 0 ? (
          <p className="text-sm text-red-600">
            Hay {productCount} producto(s) asociados. Reasígnalos antes de eliminar.
          </p>
        ) : (
          <p className="text-sm text-slate-500">Esta acción no se puede deshacer.</p>
        )}
      </div>
    </Modal>
  )
}
