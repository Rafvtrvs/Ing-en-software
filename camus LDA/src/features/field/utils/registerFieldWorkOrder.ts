// ============================================================
//  Alta unificada de OT en terreno (online / offline)
//  Admin (FieldOrderRegisterModal) + móvil (FieldOrderPanel)
// ============================================================
import { useOrdersStore } from '@/store/useOrdersStore'
import type { WorkOrder } from '@/types'
import { enqueue, flushQueue } from './fieldQueue'

export interface RegisterFieldOrderResult {
  id: string
  queued: boolean
  synced: boolean
  message: string
}

/**
 * Con conexión, la OT se crea en el servidor al momento (correo, admin y operador).
 * Sin conexión, queda en cola y se envía al recuperar la red.
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

  if (!navigator.onLine) {
    const message = `Orden ${createdId} guardada en el teléfono. Se enviará al recuperar conexión.`
    addToast(message, 'info')
    return { id: createdId, queued: true, synced: false, message }
  }

  const idsBefore = new Set(useOrdersStore.getState().orders.map((item) => item.id))
  const res = await flushQueue()
  if (res.offline) {
    const message = `Orden ${createdId} quedó pendiente: no hubo respuesta del servidor.`
    addToast(message, 'error')
    return { id: createdId, queued: true, synced: false, message }
  }
  if (res.failed.length > 0) {
    const message = res.failed[0].message
    addToast(message, 'error')
    return { id: createdId, queued: true, synced: false, message }
  }

  await useOrdersStore.getState().syncFromApi()
  const currentOrders = useOrdersStore.getState().orders
  const syncedId =
    currentOrders.find((item) => item.id === createdId)?.id ??
    currentOrders.find((item) => !idsBefore.has(item.id))?.id ??
    createdId
  const message = `Orden ${syncedId} registrada. Ya está en el sistema.`
  addToast(message, 'success')
  return { id: syncedId, queued: true, synced: true, message }
}
