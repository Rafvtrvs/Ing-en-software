import { Building2, Mail, MapPin, Pencil, Phone, User } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useInventoryStore } from '@/store/useInventoryStore'
import type { Supplier } from '@/types'

interface SupplierViewModalProps {
  supplier: Supplier | null
  open: boolean
  onClose: () => void
}

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof User
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg bg-slate-50 px-4 py-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
      <div>
        <p className="text-xs font-medium uppercase text-slate-400">{label}</p>
        <p className="text-sm font-medium text-slate-900">{value}</p>
      </div>
    </div>
  )
}

export function SupplierViewModal({ supplier, open, onClose }: SupplierViewModalProps) {
  const openSupplierModal = useInventoryStore((s) => s.openSupplierModal)

  if (!supplier) return null

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Detalle del Proveedor"
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
              openSupplierModal('edit', supplier)
            }}
          >
            Editar
          </Button>
        </>
      }
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-violet-50 p-2">
            <Building2 className="h-5 w-5 text-violet-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">{supplier.name}</h3>
            <p className="text-sm text-slate-500">{supplier.rut}</p>
          </div>
        </div>
        <Badge label={supplier.status} context="client" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Row icon={User} label="Contacto" value={supplier.contact} />
        <Row icon={Phone} label="Teléfono" value={supplier.phone} />
        <Row icon={Mail} label="Email" value={supplier.email} />
        <Row icon={MapPin} label="Dirección" value={supplier.address || '—'} />
      </div>

      <p className="mt-4 rounded-lg border border-slate-100 px-4 py-3 text-sm">
        <span className="text-slate-500">Condiciones de pago: </span>
        <span className="font-medium text-slate-900">{supplier.paymentTerms}</span>
      </p>
    </Modal>
  )
}
