// ============================================================
//  Alta unificada de OT en terreno (online / offline)
//  Admin (FieldOrderRegisterModal) + móvil (FieldOrderPanel)
// ============================================================
import { useOrdersStore } from '@/store/useOrdersStore'
import type { WorkOrder } from '@/types'
import { enqueue } from './fieldQueue'

export interface RegisterFieldOrderResult {
  id: string
  queued: boolean
  synced: boolean
  message: string
}

/**
 * Guarda la OT en el store local y la deja en cola de pendientes.
 * La subida al servidor solo ocurre al sincronizar (manual o al recuperar red),
 * para que “Pendientes de envío” muestre la OT.
 */
export async function registerFieldWorkOrder(input: {
  order: Omit<WorkOrder, 'id'> & { id?: string }
  notes?: string
}): Promise<RegisterFieldOrderResult> {
  const { addOrder, addToast } = useOrdersStore.getState()
  const notes = input.notes?.trim() || undefined

  const createdId = addOrder(
    {
      ...input.order,
      id: input.order.id ?? '',
      pendingSync: true,
    } as WorkOrder,
    { deferApi: true },
  )

  const local = useOrdersStore.getState().orders.find((o) => o.id === createdId)
  const order: WorkOrder = {
    ...(local ?? { ...input.order, id: createdId }),
    id: createdId,
    pendingSync: true,
  }

  if (notes) {
    const authorName = order.technician?.trim() || 'Operador'
    useOrdersStore.setState((state) => ({
      commentsByOrderId: {
        ...state.commentsByOrderId,
        [createdId]: [
          {
            id: `local-note-${createdId}`,
            orderId: createdId,
            content: notes,
            authorId: order.operatorIds?.[0] ?? '',
            authorName,
            createdAt: new Date().toISOString(),
          },
          ...(state.commentsByOrderId[createdId] ?? []).filter(
            (comment) => comment.id !== `local-note-${createdId}`,
          ),
        ],
      },
    }))
  }

  const queued = enqueue({
    kind: 'create-order',
    order,
    notes,
  })
  if (!queued.ok) {
    addToast('No se pudo guardar en el dispositivo (almacenamiento lleno)', 'error')
    return {
      id: createdId,
      queued: false,
      synced: false,
      message: 'Almacenamiento local lleno',
    }
  }

  const message = navigator.onLine
    ? `Orden ${createdId} lista para enviar. Pulsa «Sincronizar» o espera a que se envíe al recuperar red.`
    : `Orden ${createdId} guardada localmente. Sincronice cuando recupere conexión.`
  addToast(message, 'info')
  return { id: createdId, queued: true, synced: false, message }
}
