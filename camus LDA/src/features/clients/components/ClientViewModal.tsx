import { Building2, Mail, Pencil, Phone, User } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useClientsStore } from '@/store/useClientsStore'
import type { Client } from '@/types'

interface ClientViewModalProps {
  client: Client | null
  open: boolean
  onClose: () => void
}

function DetailRow({
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
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
        <p className="mt-0.5 text-sm font-medium text-slate-900">{value}</p>
      </div>
    </div>
  )
}

export function ClientViewModal({ client, open, onClose }: ClientViewModalProps) {
  const openEditModal = useClientsStore((s) => s.openEditModal)

  if (!client) return null

  const handleEdit = () => {
    onClose()
    openEditModal(client)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Detalle del Cliente"
      description="Información completa del cliente seleccionado."
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          <Button leftIcon={<Pencil className="h-4 w-4" />} onClick={handleEdit}>
            Editar Cliente
          </Button>
        </>
      }
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-900">{client.name}</h3>
          <p className="text-sm text-slate-500">{client.company}</p>
        </div>
        <Badge label={client.status} context="client" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <DetailRow icon={User} label="RUT" value={client.rut} />
        <DetailRow icon={Phone} label="Teléfono" value={client.phone} />
        <DetailRow icon={Mail} label="Email" value={client.email} />
        <DetailRow icon={Building2} label="Última Orden" value={client.lastOrder} />
      </div>
    </Modal>
  )
}
