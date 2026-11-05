import { Package, Pencil } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useInventoryStore } from '@/store/useInventoryStore'
import type { ProductKit } from '@/types'

interface KitViewModalProps {
  kit: ProductKit | null
  open: boolean
  onClose: () => void
}

export function KitViewModal({ kit, open, onClose }: KitViewModalProps) {
  const openKitModal = useInventoryStore((s) => s.openKitModal)
  if (!kit) return null

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Detalle del Kit"
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          <Button
            leftIcon={<Pencil className="h-4 w-4" />}
            onClick={() => {
              onClose()
              openKitModal('edit', kit)
            }}
          >
            Editar
          </Button>
        </>
      }
    >
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-900">{kit.name}</h3>
          <p className="mt-1 text-sm text-slate-500">{kit.description}</p>
        </div>
        <Badge label={kit.status} context="client" />
      </div>
      <p className="mb-2 text-sm font-semibold text-slate-700">Productos incluidos</p>
      {kit.items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
          Este kit no tiene productos.
        </p>
      ) : (
        <ul className="divide-y divide-slate-100 rounded-lg border border-slate-100">
          {kit.items.map((item) => (
            <li
              key={item.productId}
              className="flex items-center justify-between px-4 py-3 text-sm"
            >
              <span className="flex min-w-0 items-center gap-2">
                <Package className="h-4 w-4 shrink-0 text-slate-400" />
                <span className="min-w-0">
                  <span className="block font-medium text-slate-900">
                    {item.productName}
                  </span>
                  {item.productCode ? (
                    <span className="block text-xs text-slate-500">{item.productCode}</span>
                  ) : null}
                </span>
              </span>
              <span className="font-semibold tabular-nums text-slate-900">
                {item.quantity} {item.unit}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  )
}
