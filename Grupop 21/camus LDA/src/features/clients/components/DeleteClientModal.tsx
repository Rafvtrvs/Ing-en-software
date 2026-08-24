import { AlertTriangle } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useClientsStore } from '@/store/useClientsStore'
import type { Client } from '@/types'

interface DeleteClientModalProps {
  client: Client | null
  open: boolean
  onClose: () => void
}

export function DeleteClientModal({ client, open, onClose }: DeleteClientModalProps) {
  const deleteClient = useClientsStore((s) => s.deleteClient)
  const addToast = useClientsStore((s) => s.addToast)

  if (!client) return null

  const handleDelete = () => {
    deleteClient(client.id)
    addToast(`Cliente "${client.name}" eliminado correctamente`, 'info')
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Eliminar Cliente"
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            className="bg-red-600 hover:bg-red-700"
            onClick={handleDelete}
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
        <div>
          <p className="font-medium text-slate-900">
            ¿Estás seguro de eliminar a <strong>{client.name}</strong>?
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Esta acción no se puede deshacer. Se eliminará el registro de{' '}
            <strong>{client.company}</strong> del sistema.
          </p>
        </div>
      </div>
    </Modal>
  )
}
