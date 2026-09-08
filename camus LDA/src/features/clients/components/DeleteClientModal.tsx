import { AlertTriangle, Building2, ClipboardList, Mail, User, XCircle } from 'lucide-react'

import { Modal } from '@/components/ui/Modal'

import { Button } from '@/components/ui/Button'

import { useClientsStore } from '@/store/useClientsStore'

import { useOrdersStore } from '@/store/useOrdersStore'

import {

  getClientActiveOrders,

  getClientOrders,

} from '@/features/clients/utils/clientActiveOrders'

import type { Client } from '@/types'



interface DeleteClientModalProps {

  client: Client | null

  open: boolean

  onClose: () => void

}



/**

 * RF64 CDS 220 + RF69 CDS 236/237 — Eliminación con verificación de OT activas

 */

export function DeleteClientModal({ client, open, onClose }: DeleteClientModalProps) {

  const deleteClient = useClientsStore((s) => s.deleteClient)

  const addToast = useClientsStore((s) => s.addToast)

  const orders = useOrdersStore((s) => s.orders)



  if (!client) return null



  const associatedOrders = getClientOrders(client, orders)

  const activeOrders = getClientActiveOrders(client, orders)

  const hasActiveOrders = activeOrders.length > 0



  const handleDelete = () => {

    deleteClient(client.id)

    addToast('Cliente eliminado correctamente')

    onClose()

  }



  if (hasActiveOrders) {

    return (

      <Modal

        open={open}

        onClose={onClose}

        title="No es posible eliminar este cliente"

        description="El cliente tiene órdenes de trabajo activas asociadas."

        size="md"

        footer={

          <Button onClick={onClose}>Entendido</Button>

        }

      >

        <div className="space-y-4">

          <div className="flex flex-col items-center gap-3 py-2 text-center">

            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50">

              <XCircle className="h-7 w-7 text-red-500" />

            </div>

            <p className="text-sm text-slate-600">

              El cliente tiene órdenes de trabajo activas asociadas y no puede ser eliminado.

            </p>

          </div>



          <div className="rounded-xl border border-red-100 bg-red-50/50 p-4 text-sm">

            <p>

              <span className="text-slate-500">Cliente:</span>{' '}

              <strong>{client.name}</strong>

            </p>

            <p className="mt-1">

              <span className="text-slate-500">Identificador:</span>{' '}

              <strong>{client.rut}</strong>

            </p>

            <p className="mt-2 font-semibold text-red-700">

              Órdenes activas: {activeOrders.length}

            </p>

          </div>



          <ul className="max-h-32 overflow-y-auto rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-900">

            {activeOrders.map((o) => (

              <li key={o.id}>

                {o.id} — {o.status} — {o.service ?? o.category}

              </li>

            ))}

          </ul>

        </div>

      </Modal>

    )

  }



  return (

    <Modal

      open={open}

      onClose={onClose}

      title="Eliminar cliente"

      description="Verificación completada: no hay órdenes activas asociadas."

      size="md"

      footer={

        <>

          <Button variant="outline" onClick={onClose}>

            Cancelar

          </Button>

          <Button className="bg-red-600 hover:bg-red-700" onClick={handleDelete}>

            Confirmar eliminación

          </Button>

        </>

      }

    >

      <div className="space-y-4">

        <div className="flex flex-col items-center gap-3 py-2 text-center">

          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50">

            <AlertTriangle className="h-7 w-7 text-red-500" />

          </div>

          <p className="font-medium text-slate-900">

            ¿Está seguro de que desea eliminar este cliente?

          </p>

          <p className="text-sm text-slate-500">

            Se eliminará el registro de <strong>{client.company}</strong> del sistema.

          </p>

        </div>



        <div className="grid gap-3 sm:grid-cols-2">

          <div className="flex items-start gap-3 rounded-lg bg-slate-50 px-4 py-3">

            <User className="mt-0.5 h-4 w-4 text-slate-400" />

            <div>

              <p className="text-xs font-medium uppercase text-slate-400">Cliente</p>

              <p className="text-sm font-medium text-slate-900">{client.name}</p>

            </div>

          </div>

          <div className="flex items-start gap-3 rounded-lg bg-slate-50 px-4 py-3">

            <Mail className="mt-0.5 h-4 w-4 text-slate-400" />

            <div>

              <p className="text-xs font-medium uppercase text-slate-400">Correo</p>

              <p className="text-sm font-medium text-slate-900">{client.email}</p>

            </div>

          </div>

          <div className="flex items-start gap-3 rounded-lg bg-slate-50 px-4 py-3">

            <Building2 className="mt-0.5 h-4 w-4 text-slate-400" />

            <div>

              <p className="text-xs font-medium uppercase text-slate-400">Empresa</p>

              <p className="text-sm font-medium text-slate-900">{client.company}</p>

            </div>

          </div>

          <div className="flex items-start gap-3 rounded-lg bg-slate-50 px-4 py-3">

            <ClipboardList className="mt-0.5 h-4 w-4 text-slate-400" />

            <div>

              <p className="text-xs font-medium uppercase text-slate-400">OT asociadas</p>

              <p className="text-sm font-medium text-slate-900">

                {associatedOrders.length} (0 activas)

              </p>

            </div>

          </div>

        </div>

      </div>

    </Modal>

  )

}


