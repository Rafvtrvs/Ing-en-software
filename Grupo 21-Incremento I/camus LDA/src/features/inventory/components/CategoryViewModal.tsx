import { Pencil, Tag } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useInventoryStore } from '@/store/useInventoryStore'
import type { ProductCategory } from '@/types'

interface CategoryViewModalProps {
  category: ProductCategory | null
  open: boolean
  onClose: () => void
}

export function CategoryViewModal({ category, open, onClose }: CategoryViewModalProps) {
  const products = useInventoryStore((s) => s.products)
  const openCategoryModal = useInventoryStore((s) => s.openCategoryModal)

  if (!category) return null

  const productCount = products.filter((p) => p.category === category.name).length

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Detalle de Categoría"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          <Button
            leftIcon={<Pencil className="h-4 w-4" />}
            onClick={() => {
              onClose()
              openCategoryModal('edit', category)
            }}
          >
            Editar
          </Button>
        </>
      }
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-blue-50 p-2">
            <Tag className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">{category.name}</h3>
            <p className="text-sm text-slate-500">{productCount} productos asociados</p>
          </div>
        </div>
        <Badge label={category.status} context="client" />
      </div>
      <p className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-700">
        {category.description || 'Sin descripción'}
      </p>
    </Modal>
  )
}
