import { Package, Pencil, Tag } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useInventoryStore } from '@/store/useInventoryStore'
import type { Product } from '@/types'

interface ProductViewModalProps {
  product: Product | null
  open: boolean
  onClose: () => void
}

export function ProductViewModal({ product, open, onClose }: ProductViewModalProps) {
  const openEditModal = useInventoryStore((s) => s.openEditModal)

  if (!product) return null

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Detalle del Producto"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          <Button
            leftIcon={<Pencil className="h-4 w-4" />}
            onClick={() => {
              onClose()
              openEditModal(product)
            }}
          >
            Editar
          </Button>
        </>
      }
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">{product.code}</p>
          <h3 className="text-xl font-bold text-slate-900">{product.name}</h3>
        </div>
        <Badge label={product.status} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex items-start gap-3 rounded-lg bg-slate-50 px-4 py-3">
          <Tag className="mt-0.5 h-4 w-4 text-slate-400" />
          <div>
            <p className="text-xs font-medium uppercase text-slate-400">Categoría</p>
            <p className="text-sm font-medium text-slate-900">{product.category}</p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-lg bg-slate-50 px-4 py-3">
          <Package className="mt-0.5 h-4 w-4 text-slate-400" />
          <div>
            <p className="text-xs font-medium uppercase text-slate-400">Unidad</p>
            <p className="text-sm font-medium text-slate-900">{product.unit}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 rounded-xl border border-slate-100 p-4">
        <div>
          <p className="text-xs text-slate-500">Stock actual</p>
          <p className="text-2xl font-bold text-slate-900">
            {product.currentStock}{' '}
            <span className="text-sm font-normal text-slate-500">{product.unit}</span>
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Stock mínimo</p>
          <p className="text-2xl font-bold text-slate-900">
            {product.minStock}{' '}
            <span className="text-sm font-normal text-slate-500">{product.unit}</span>
          </p>
        </div>
      </div>
    </Modal>
  )
}
