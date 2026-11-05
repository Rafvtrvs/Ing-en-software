import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { arrayMove } from '@dnd-kit/sortable'
import type {
  OrderApprovalRecord,
  OrderComment,
  OrderDocument,
  OrderDocumentKind,
  OrderIntervention,
  OrderModificationHistoryEntry,
  OrderModificationRequest,
  OrderOperator,
  OrderPriority,
  OrderRescheduleEvent,
  OrderStatus,
  OrderPhotoAnnotation,
  OrderSupplyUsage,
  PhotoDrawingStroke,
  ThirdPartyIntervention,
  WorkOrder,
} from '@/types'
import { ordersService } from '@/services/ordersService'
import { authService } from '@/services/authService'

/** Usuario autenticado para trazabilidad de cambios en OT. */
function currentHistoryActor(): { id: string; name: string } {
  const user = authService.getUser()
  return {
    id: user?.id?.trim() || 'sistema',
    name: user?.name?.trim() || user?.email?.trim() || 'Sistema',
  }
}
import {
  applySortOrderToColumn,
  getColumnOrders,
  normalizeOrdersSort,
  ORDER_STATUSES,
} from '@/features/orders/utils/orderSort'
import {
  clampProgress,
  progressForStatus,
} from '@/features/orders/utils/orderProgress'
import { useNotificationsStore } from '@/store/useNotificationsStore'
import { useInventoryStore } from '@/store/useInventoryStore'
import { useEquipmentStore } from '@/store/useEquipmentStore'

function syncEquipmentLocations() {
  const orders = useOrdersStore.getState().orders
  void useEquipmentStore.getState().syncLocationsFromOrders(orders)
}
import { getOrderFieldChanges } from '@/features/orders/utils/orderFieldChanges'
import { calcDurationHours, validateServiceTimeSequence } from '@/features/orders/utils/orderDates'
import {
  getExecutionDate,
  validateRescheduleDate,
} from '@/features/orders/utils/rescheduleValidation'
import {
  resolveOrderPriority,
} from '@/features/orders/utils/priorityRules'
import { allocateOrderId } from '@/features/orders/utils/nextOrderId'

export type OrderModalMode =
  | 'create'
  | 'edit'
  | 'view'
  | 'delete'
  | 'cancel'
  | 'annul'
  | 'reschedule'
  | 'modRequest'
  | null

export interface ToastMessage {
  id: number
  type: 'success' | 'error' | 'info'
  message: string
}

export interface OperatorWorkload {
  operatorId: string
  name: string
  activeOrders: number
  pendingOrders: number
  inProgressOrders: number
  totalAssigned: number
}

/** RF-56 — marcas de inicio/término que el API no guarda */
interface ServiceClock {
  serviceStartedAt?: string
  serviceEndedAt?: string
  clientSignature?: string
  timeCorrectionNote?: string
  startDate?: string
  endDate?: string
  durationHours?: number
}

function applyServiceClocks(
  orders: WorkOrder[],
  clocks: Record<string, ServiceClock>,
): WorkOrder[] {
  return orders.map((order) => {
    const clock = clocks[order.id]
    if (!clock) return order
    return {
      ...order,
      serviceStartedAt: clock.serviceStartedAt ?? order.serviceStartedAt,
      serviceEndedAt: clock.serviceEndedAt ?? order.serviceEndedAt,
      clientSignature: clock.clientSignature ?? order.clientSignature,
      timeCorrectionNote: clock.timeCorrectionNote ?? order.timeCorrectionNote,
      startDate: clock.startDate ?? order.startDate,
      endDate: clock.endDate ?? order.endDate,
      durationHours: clock.durationHours ?? order.durationHours,
    }
  })
}

interface OrdersState {
  orders: WorkOrder[]
  /** RF-56 CU-197/198 — sobrevive a la sincronización con el servidor */
  serviceClocks: Record<string, ServiceClock>
  apiAvailable: boolean
  /** Intervenciones locales por OT (fallback / caché CU-149–151) */
  interventionsByOrderId: Record<string, OrderIntervention[]>
  /** RF65 — comentarios por OT */
  commentsByOrderId: Record<string, OrderComment[]>
  /** RF66 CDS 229 — reprogramaciones por OT */
  rescheduleHistoryByOrderId: Record<string, OrderRescheduleEvent[]>
  /** RF68 — solicitudes de modificación */
  modificationRequests: OrderModificationRequest[]
  /** RF68 CDS 235 — historial modificaciones por OT */
  modificationHistoryByOrderId: Record<string, OrderModificationHistoryEntry[]>
  modalMode: OrderModalMode
  selectedOrder: WorkOrder | null
  statusFilter: OrderStatus | 'all'
  /** Filtro urgencia dashboard/listado (CU-172 / CU-177) */
  urgencyFilter: 'all' | 'urgent'
  showFilters: boolean
  toasts: ToastMessage[]
  syncFromApi: () => Promise<void>
  addOrder: (order: WorkOrder) => string
  updateOrder: (id: string, data: Partial<WorkOrder>, options?: { fromForm?: boolean }) => void
  deleteOrder: (id: string) => void
  addIntervention: (orderId: string, detail: string) => Promise<OrderIntervention>
  updateIntervention: (
    orderId: string,
    interventionId: number,
    detail: string,
  ) => Promise<OrderIntervention>
  fetchInterventions: (orderId: string) => Promise<OrderIntervention[]>
  getInterventions: (orderId: string) => OrderIntervention[]
  assignOperators: (
    orderId: string,
    operators: OrderOperator[],
  ) => void
  reassignOperators: (
    orderId: string,
    operators: OrderOperator[],
  ) => void
  setOrderDates: (
    orderId: string,
    dates: {
      startDate?: string
      endDate?: string
      durationHours?: number
      timeCorrectionNote?: string
    },
  ) => { ok: boolean; message?: string }
  /** RF-56 CU-197 — inicio de jornada en terreno */
  startFieldService: (orderId: string) => { ok: boolean; message?: string }
  /** RF-56 CU-198 — cierre con firma y duración */
  finishFieldService: (
    orderId: string,
    clientSignature: string,
  ) => { ok: boolean; message?: string }
  setOrderPriority: (
    orderId: string,
    priority: OrderPriority,
    manual?: boolean,
  ) => void
  addPhotoUrl: (orderId: string, url: string) => void
  removePhotoUrl: (orderId: string, url: string) => void
  /** RF55 — anotaciones sobre fotos */
  photoAnnotationsByOrderId: Record<string, OrderPhotoAnnotation[]>
  getPhotoAnnotation: (orderId: string, photoUrl: string) => OrderPhotoAnnotation | undefined
  savePhotoAnnotation: (
    orderId: string,
    photoUrl: string,
    strokes: PhotoDrawingStroke[],
  ) => void
  addThirdParty: (
    orderId: string,
    data: Omit<ThirdPartyIntervention, 'id' | 'orderId' | 'registeredAt'>,
  ) => ThirdPartyIntervention
  updateThirdParty: (
    orderId: string,
    thirdPartyId: string,
    data: Partial<Omit<ThirdPartyIntervention, 'id' | 'orderId'>>,
  ) => void
  getOperatorWorkload: (technicians: OrderOperator[]) => OperatorWorkload[]
  markPdfGenerated: (orderId: string) => void
  /** RF-40..42 documentos / contratos / reportes versionados */
  addOrderDocument: (
    orderId: string,
    data: {
      id?: string
      kind: OrderDocumentKind
      title: string
      fileName: string
      url: string
      mimeType: string
      sizeBytes: number
      uploadedBy: string
      note?: string
    },
  ) => OrderDocument
  addDocumentVersion: (
    orderId: string,
    documentId: string,
    data: {
      fileName: string
      url: string
      mimeType: string
      sizeBytes: number
      uploadedBy: string
      note?: string
    },
  ) => void
  /** RF-43 — alta rápida de OT en terreno */
  createFieldOrder: (data: {
    client: string
    address: string
    service: string
    category: string
    technician: string
    notes?: string
  }) => WorkOrder
  completeFieldOrderForm: (
    orderId: string,
    data: Partial<Pick<WorkOrder, 'service' | 'startDate' | 'endDate' | 'durationHours' | 'progress'>>,
  ) => void
  moveOrderOnBoard: (activeId: string, overId: string) => void
  /** Reordena la cola de atención por IDs en el nuevo orden visual */
  reorderPriorityQueue: (orderedIds: string[]) => void
  openCreateModal: () => void
  openEditModal: (order: WorkOrder) => void
  openViewModal: (order: WorkOrder) => void
  openDeleteModal: (order: WorkOrder) => void
  openCancelModal: (order: WorkOrder) => void
  openAnnulModal: (order: WorkOrder) => void
  cancelOrder: (orderId: string, reason: string) => void
  annulOrder: (orderId: string, reason: string) => void
  registerSupplies: (
    orderId: string,
    supplies: Omit<OrderSupplyUsage, 'registeredAt'>[],
  ) => Promise<{ ok: boolean; message?: string }>
  removeRegisteredSupply: (
    orderId: string,
    supplyIndex: number,
  ) => Promise<{ ok: boolean; message?: string }>
  approveOrder: (
    orderId: string,
    approval: Omit<OrderApprovalRecord, 'approvedAt'> & { approvedAt?: string },
  ) => { ok: boolean; message?: string }
  addOrderComment: (
    orderId: string,
    content: string,
    author: { id: string; name: string },
  ) => Promise<{ ok: boolean; message?: string }>
  fetchOrderComments: (orderId: string) => Promise<OrderComment[]>
  getOrderComments: (orderId: string) => OrderComment[]
  openRescheduleModal: (order: WorkOrder) => void
  openModificationRequestModal: (order: WorkOrder) => void
  rescheduleOrder: (
    orderId: string,
    newDate: string,
    user: { id: string; name: string },
  ) => Promise<{ ok: boolean; message?: string }>
  validateReschedule: (orderId: string, newDate: string) => {
    available: boolean
    reasons: string[]
  }
  getRescheduleHistory: (orderId: string) => OrderRescheduleEvent[]
  fetchRescheduleHistory: (orderId: string) => Promise<OrderRescheduleEvent[]>
  syncModificationRequests: () => Promise<void>
  fetchModificationHistory: (orderId: string) => Promise<OrderModificationHistoryEntry[]>
  submitModificationRequest: (
    orderId: string,
    data: { fieldsToModify: string; reason: string },
    operator: { id: string; name: string },
  ) => Promise<{ ok: boolean; message?: string }>
  approveModificationRequest: (
    requestId: string,
    reviewer: { id: string; name: string },
  ) => Promise<{ ok: boolean; message?: string }>
  rejectModificationRequest: (
    requestId: string,
    reason: string,
    reviewer: { id: string; name: string },
  ) => Promise<{ ok: boolean; message?: string }>
  getModificationHistory: (orderId: string) => OrderModificationHistoryEntry[]
  addModificationHistory: (
    orderId: string,
    entry: Omit<OrderModificationHistoryEntry, 'id' | 'orderId' | 'changedAt'>,
  ) => void
  closeModal: () => void
  setStatusFilter: (status: OrderStatus | 'all') => void
  setUrgencyFilter: (filter: 'all' | 'urgent') => void
  toggleFilters: () => void
  addToast: (message: string, type?: ToastMessage['type']) => void
  removeToast: (id: number) => void
}

let toastId = 0

function thirdPartyId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `tp-${crypto.randomUUID().split('-')[0]}`
  }
  return `tp-${Date.now()}`
}

function eventId(prefix: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID().split('-')[0]}`
  }
  return `${prefix}-${Date.now()}`
}

/** Conserva solo extras frontend-only; Postgres manda en estado/asignación. */
function mergeApiOrders(
  apiOrders: WorkOrder[],
  localOrders: WorkOrder[],
): WorkOrder[] {
  const localById = new Map(localOrders.map((o) => [o.id, o]))
  return apiOrders.map((api) => {
    const local = localById.get(api.id)
    if (!local) return api
    return {
      ...api,
      // Postgres manda en fechas/camión; el resto aún puede ser local (terreno)
      startDate: api.startDate ?? local.startDate,
      endDate: api.endDate ?? local.endDate,
      durationHours: api.durationHours ?? local.durationHours,
      truckCode: api.truckCode ?? local.truckCode,
      equipmentId: api.equipmentId ?? local.equipmentId,
      serviceStartedAt: local.serviceStartedAt ?? api.serviceStartedAt,
      serviceEndedAt: local.serviceEndedAt ?? api.serviceEndedAt,
      clientSignature: local.clientSignature ?? api.clientSignature,
      timeCorrectionNote: local.timeCorrectionNote ?? api.timeCorrectionNote,
      incidentType: local.incidentType ?? api.incidentType,
      priorityManual: local.priorityManual ?? api.priorityManual,
      photoUrls: local.photoUrls ?? api.photoUrls,
      thirdParties: local.thirdParties ?? api.thirdParties,
      documents: local.documents ?? api.documents,
      pdfGeneratedAt: local.pdfGeneratedAt ?? api.pdfGeneratedAt,
      queueOrder: local.queueOrder ?? api.queueOrder,
      executionDate: local.executionDate ?? api.executionDate,
      suppliesUsed: local.suppliesUsed ?? api.suppliesUsed,
      approval: local.approval ?? api.approval,
      cancelReason: local.cancelReason ?? api.cancelReason,
      annulReason: local.annulReason ?? api.annulReason,
      priority: local.priorityManual
        ? local.priority
        : (api.priority ?? local.priority),
    }
  })
}

function withDerivedDuration(data: Partial<WorkOrder>, existing?: WorkOrder): Partial<WorkOrder> {
  const start = data.startDate !== undefined ? data.startDate : existing?.startDate
  const end = data.endDate !== undefined ? data.endDate : existing?.endDate
  if (data.durationHours !== undefined) return data
  const calc = calcDurationHours(start, end)
  if (calc === undefined) return data
  return { ...data, durationHours: calc }
}

export const useOrdersStore = create<OrdersState>()(
  persist(
    (set, get) => ({
      orders: [],
      serviceClocks: {},
      apiAvailable: false,
      interventionsByOrderId: {},
      commentsByOrderId: {},
      rescheduleHistoryByOrderId: {},
      modificationRequests: [],
      modificationHistoryByOrderId: {},
      photoAnnotationsByOrderId: {},
      modalMode: null,
      selectedOrder: null,
      statusFilter: 'all',
      urgencyFilter: 'all',
      showFilters: false,
      toasts: [],

      syncFromApi: async () => {
        try {
          const [orders, modificationRequests] = await Promise.all([
            ordersService.list(),
            ordersService.listModificationRequests().catch(() => [] as OrderModificationRequest[]),
          ])
          const merged = applyServiceClocks(
            mergeApiOrders(orders, get().orders),
            get().serviceClocks,
          )
          const nextOrders = normalizeOrdersSort(merged)
          const selectedId = get().selectedOrder?.id
          set({
            orders: nextOrders,
            apiAvailable: true,
            modificationRequests,
            ...(selectedId
              ? {
                  selectedOrder:
                    nextOrders.find((o) => o.id === selectedId) ??
                    get().selectedOrder,
                }
              : null),
          })
        } catch {
          set({ apiAvailable: false })
        }
      },

      syncModificationRequests: async () => {
        try {
          const modificationRequests =
            await ordersService.listModificationRequests()
          set({ modificationRequests, apiAvailable: true })
        } catch {
          set({ apiAvailable: false })
        }
      },

      addOrder: (order) => {
        const newId = allocateOrderId(
          get().orders.map((o) => o.id),
          order.id,
        )
        const priority = resolveOrderPriority({
          priority: order.priority,
          priorityManual: order.priorityManual,
          incidentType: order.incidentType ?? order.category,
        })
        const withDates = withDerivedDuration(order)
        const newOrder: WorkOrder = {
          ...order,
          ...withDates,
          id: newId,
          sortOrder: 0,
          priority,
          incidentType: order.incidentType ?? (order.category as WorkOrder['incidentType']),
        }
        set((state) => {
          const status = order.status
          const column = getColumnOrders(state.orders, status)
          const bumped = column.map((o, i) => ({ ...o, sortOrder: i + 1 }))
          const bumpedIds = new Set(bumped.map((o) => o.id))
          const orders = state.orders.map((o) =>
            bumpedIds.has(o.id) ? bumped.find((b) => b.id === o.id)! : o,
          )
          return { orders: [newOrder, ...orders] }
        })

        useNotificationsStore.getState().pushOrderCreated({
          orderId: newId,
          client: order.client,
          service: order.service ?? order.category,
          status: order.status,
        })

        ordersService
          .create({ ...newOrder })
          .then(() => set({ apiAvailable: true }))
          .catch(() => set({ apiAvailable: false }))
          .finally(() => syncEquipmentLocations())

        if (newOrder.truckCode || newOrder.equipmentId) {
          syncEquipmentLocations()
        }

        return newId
      },

      updateOrder: (id, data, options) => {
        const existing = get().orders.find((o) => o.id === id)
        const enriched = withDerivedDuration(data, existing)
        if (enriched.progress !== undefined) {
          enriched.progress = clampProgress(enriched.progress)
        }
        if (
          enriched.incidentType &&
          !enriched.priorityManual &&
          existing &&
          !existing.priorityManual &&
          enriched.priority === undefined
        ) {
          enriched.priority = resolveOrderPriority({
            incidentType: enriched.incidentType,
            priorityManual: false,
          })
        }
        const merged = existing ? { ...existing, ...enriched } : null

        set((state) => {
          const orders = state.orders.map((o) =>
            o.id === id ? { ...o, ...enriched } : o,
          )
          const selectedOrder =
            state.selectedOrder?.id === id
              ? { ...state.selectedOrder, ...enriched }
              : state.selectedOrder
          return { orders, selectedOrder }
        })

        if (existing && merged) {
          if (options?.fromForm) {
            const changes = getOrderFieldChanges(existing, merged)
            if (changes.length > 0) {
              // Campanita local siempre; admins en otros dispositivos reciben FCM
              useNotificationsStore.getState().pushOrderFieldChanges({
                orderId: existing.id,
                client: merged.client,
                changes,
              })
              const actor = currentHistoryActor()
              for (const change of changes) {
                get().addModificationHistory(existing.id, {
                  field: change.field,
                  fieldLabel: change.label,
                  previousValue: change.from,
                  newValue: change.to,
                  changedById: actor.id,
                  changedByName: actor.name,
                })
              }
            }
          } else if (data.status && data.status !== existing.status) {
            useNotificationsStore.getState().pushOrderStatusChange({
              orderId: existing.id,
              client: existing.client,
              previousStatus: existing.status,
              newStatus: data.status,
            })
            // RF-8 — registrar cambio de estado en historial de la OT
            const actor = currentHistoryActor()
            get().addModificationHistory(existing.id, {
              field: 'status',
              fieldLabel: 'Estado',
              previousValue: existing.status,
              newValue: data.status,
              changedById: actor.id,
              changedByName: actor.name,
            })
          }
        }

        const shouldSyncLocation =
          Boolean(existing) &&
          ('truckCode' in data ||
            'equipmentId' in data ||
            'address' in data ||
            'status' in data)

        ordersService
          .update(id, enriched)
          .then((updated) => {
            if (!updated) {
              set({ apiAvailable: true })
              return
            }
            const patched = {
              ...updated,
              ...(typeof updated.progress === 'number'
                ? { progress: clampProgress(updated.progress) }
                : null),
            }
            set((state) => ({
              apiAvailable: true,
              orders: state.orders.map((o) =>
                o.id === id ? { ...o, ...patched } : o,
              ),
              selectedOrder:
                state.selectedOrder?.id === id
                  ? { ...state.selectedOrder, ...patched }
                  : state.selectedOrder,
            }))
          })
          .catch(() => set({ apiAvailable: false }))
          .finally(() => {
            if (shouldSyncLocation) syncEquipmentLocations()
          })

        if (shouldSyncLocation) syncEquipmentLocations()
      },

      deleteOrder: (id) => {
        set((state) => {
          const removed = state.orders.find((o) => o.id === id)
          let orders = state.orders.filter((o) => o.id !== id)
          if (removed) {
            orders = normalizeOrdersSort(orders)
          }
          const { [id]: _removed, ...restInterventions } =
            state.interventionsByOrderId
          return {
            orders,
            interventionsByOrderId: restInterventions,
            ...(state.selectedOrder?.id === id
              ? { selectedOrder: null, modalMode: null }
              : null),
          }
        })
        ordersService
          .remove(id)
          .then(() => set({ apiAvailable: true }))
          .catch(() => set({ apiAvailable: false }))
          .finally(() => syncEquipmentLocations())
        syncEquipmentLocations()
      },

      addIntervention: async (orderId, detail) => {
        const trimmed = detail.trim()
        if (!trimmed) {
          throw new Error('La descripción de la intervención es obligatoria')
        }

        const order = get().orders.find((o) => o.id === orderId)
        if (!order) {
          throw new Error('Orden de trabajo no encontrada')
        }

        const now = new Date().toLocaleString('es-CL')
        try {
          const created = await ordersService.createIntervention(orderId, trimmed)
          const withMeta: OrderIntervention = {
            ...created,
            createdAt: created.createdAt ?? now,
            updatedAt: created.updatedAt ?? now,
          }
          set((state) => ({
            apiAvailable: true,
            interventionsByOrderId: {
              ...state.interventionsByOrderId,
              [orderId]: [
                withMeta,
                ...(state.interventionsByOrderId[orderId] ?? []),
              ],
            },
          }))
          get().addToast('Intervención registrada exitosamente')
          useNotificationsStore.getState().pushOrderActivity({
            orderId,
            title: `Orden ${orderId}: intervención`,
            message: `Se registró una intervención en la OT de ${order.client}: "${trimmed.slice(0, 100)}${trimmed.length > 100 ? '…' : ''}"`,
          })
          return withMeta
        } catch {
          const local: OrderIntervention = {
            id: Date.now(),
            orderId,
            detail: trimmed,
            createdAt: now,
            updatedAt: now,
          }
          set((state) => ({
            apiAvailable: false,
            interventionsByOrderId: {
              ...state.interventionsByOrderId,
              [orderId]: [
                local,
                ...(state.interventionsByOrderId[orderId] ?? []),
              ],
            },
          }))
          get().addToast('Intervención registrada exitosamente')
          useNotificationsStore.getState().pushOrderActivity({
            orderId,
            title: `Orden ${orderId}: intervención`,
            message: `Se registró una intervención en la OT de ${order.client}: "${trimmed.slice(0, 100)}${trimmed.length > 100 ? '…' : ''}"`,
          })
          return local
        }
      },

      updateIntervention: async (orderId, interventionId, detail) => {
        const trimmed = detail.trim()
        if (!trimmed) {
          throw new Error('La descripción de la intervención es obligatoria')
        }

        const now = new Date().toLocaleString('es-CL')
        try {
          const updated = await ordersService.updateIntervention(
            orderId,
            interventionId,
            trimmed,
          )
          const withMeta: OrderIntervention = {
            ...updated,
            updatedAt: updated.updatedAt ?? now,
          }
          set((state) => {
            const list = state.interventionsByOrderId[orderId] ?? []
            return {
              apiAvailable: true,
              interventionsByOrderId: {
                ...state.interventionsByOrderId,
                [orderId]: list.map((i) =>
                  i.id === interventionId
                    ? { ...i, ...withMeta, detail: trimmed }
                    : i,
                ),
              },
            }
          })
          get().addToast('Intervención actualizada')
          return withMeta
        } catch {
          set((state) => {
            const list = state.interventionsByOrderId[orderId] ?? []
            const found = list.find((i) => i.id === interventionId)
            if (!found) return state
            return {
              apiAvailable: false,
              interventionsByOrderId: {
                ...state.interventionsByOrderId,
                [orderId]: list.map((i) =>
                  i.id === interventionId
                    ? { ...i, detail: trimmed, updatedAt: now }
                    : i,
                ),
              },
            }
          })
          const local = get().interventionsByOrderId[orderId]?.find(
            (i) => i.id === interventionId,
          )
          if (!local) throw new Error('Intervención no encontrada')
          get().addToast('Intervención actualizada')
          return local
        }
      },

      fetchInterventions: async (orderId) => {
        try {
          const list = await ordersService.listInterventions(orderId)
          set((state) => {
            const prev = state.interventionsByOrderId[orderId]
            const next = list.length > 0 ? list : prev
            if (next === prev && state.apiAvailable) return state
            return {
              apiAvailable: true,
              interventionsByOrderId: next
                ? {
                    ...state.interventionsByOrderId,
                    [orderId]: next,
                  }
                : state.interventionsByOrderId,
            }
          })
          return get().interventionsByOrderId[orderId] ?? list
        } catch {
          if (get().apiAvailable) set({ apiAvailable: false })
          return get().interventionsByOrderId[orderId] ?? []
        }
      },

      getInterventions: (orderId) =>
        get().interventionsByOrderId[orderId] ?? [],

      assignOperators: (orderId, operators) => {
        const order = get().orders.find((o) => o.id === orderId)
        const technician = operators[0]?.name ?? ''
        get().updateOrder(orderId, {
          operatorIds: operators.map((o) => o.id),
          operators,
          technician,
        })
        get().addToast(
          operators.length
            ? `Cuadrilla asignada (${operators.length})`
            : 'Asignación limpiada',
          'info',
        )
        if (order && operators.length > 0) {
          useNotificationsStore.getState().pushOrderActivity({
            orderId,
            title: `Orden ${orderId}: cuadrilla asignada`,
            message: `${operators.map((o) => o.name).join(', ')} asignado(s) a la OT de ${order.client}.`,
          })
        }
      },

      /** Reasignar: revoca permisos previos al reemplazar operatorIds (CU-161 / CU-187) */
      reassignOperators: (orderId, operators) => {
        const order = get().orders.find((o) => o.id === orderId)
        const technician = operators[0]?.name ?? ''
        get().updateOrder(orderId, {
          operatorIds: operators.map((o) => o.id),
          operators,
          technician,
        })
        get().addToast('Operadores reasignados — permisos previos revocados', 'info')
        if (order) {
          useNotificationsStore.getState().pushOrderActivity({
            orderId,
            title: `Orden ${orderId}: operadores reasignados`,
            message: operators.length
              ? `Nueva cuadrilla: ${operators.map((o) => o.name).join(', ')} (${order.client}).`
              : `Se limpió la asignación de la OT de ${order.client}.`,
          })
        }
      },

      setOrderDates: (orderId, dates) => {
        const existing = get().orders.find((o) => o.id === orderId)
        const start = dates.startDate ?? existing?.startDate
        const end = dates.endDate ?? existing?.endDate
        const sequenceError = validateServiceTimeSequence(start, end)
        if (sequenceError) {
          get().addToast(sequenceError, 'error')
          return { ok: false, message: sequenceError }
        }
        const duration =
          dates.durationHours ??
          (start && end ? calcDurationHours(start, end) : existing?.durationHours)
        get().updateOrder(orderId, {
          ...dates,
          durationHours: duration,
        })
        set((state) => ({
          serviceClocks: {
            ...state.serviceClocks,
            [orderId]: {
              ...state.serviceClocks[orderId],
              startDate: dates.startDate,
              endDate: dates.endDate,
              durationHours: duration,
              timeCorrectionNote: dates.timeCorrectionNote,
            },
          },
        }))
        get().addToast(
          dates.timeCorrectionNote
            ? 'Tiempos corregidos y registrados en la orden'
            : 'Fechas de la orden actualizadas',
        )
        return { ok: true }
      },

      startFieldService: (orderId) => {
        const order = get().orders.find((o) => o.id === orderId)
        if (!order) return { ok: false, message: 'Orden no encontrada' }
        if (order.status !== 'Pendiente') {
          return { ok: false, message: 'Solo se puede iniciar una orden pendiente' }
        }
        if (order.serviceStartedAt || get().serviceClocks[orderId]?.serviceStartedAt) {
          return { ok: false, message: 'El inicio de servicio ya está registrado' }
        }
        const now = new Date()
        const serviceStartedAt = now.toISOString()
        const startDate = serviceStartedAt.slice(0, 10)
        get().updateOrder(orderId, {
          status: 'En Curso',
          progress: Math.max(order.progress ?? 0, 10),
          serviceStartedAt,
          startDate,
        })
        set((state) => ({
          serviceClocks: {
            ...state.serviceClocks,
            [orderId]: {
              ...state.serviceClocks[orderId],
              serviceStartedAt,
              startDate,
            },
          },
        }))
        get().addToast('Servicio iniciado. Fecha y hora de inicio bloqueadas.')
        return { ok: true }
      },

      finishFieldService: (orderId, clientSignature) => {
        const signature = clientSignature.trim()
        if (signature.length < 3) {
          return { ok: false, message: 'La firma del cliente es obligatoria' }
        }
        const order = get().orders.find((o) => o.id === orderId)
        if (!order) return { ok: false, message: 'Orden no encontrada' }
        if (order.status !== 'En Curso') {
          return { ok: false, message: 'La orden debe estar en ejecución' }
        }
        const now = new Date()
        const started = order.serviceStartedAt ?? order.startDate
        const sequenceError = validateServiceTimeSequence(started, now.toISOString())
        if (sequenceError) {
          get().addToast(sequenceError, 'error')
          return { ok: false, message: sequenceError }
        }
        const hours = calcDurationHours(started, now.toISOString())
        const serviceEndedAt = now.toISOString()
        const endDate = serviceEndedAt.slice(0, 10)
        get().updateOrder(orderId, {
          status: 'Completada',
          progress: 100,
          serviceEndedAt,
          endDate,
          durationHours: hours,
          clientSignature: signature,
        })
        set((state) => ({
          serviceClocks: {
            ...state.serviceClocks,
            [orderId]: {
              ...state.serviceClocks[orderId],
              serviceStartedAt: order.serviceStartedAt ?? state.serviceClocks[orderId]?.serviceStartedAt,
              serviceEndedAt,
              endDate,
              durationHours: hours,
              clientSignature: signature,
              startDate: order.startDate ?? state.serviceClocks[orderId]?.startDate,
            },
          },
        }))
        get().addToast(
          hours != null
            ? `Servicio finalizado. Duración: ${hours} h`
            : 'Servicio finalizado',
        )
        return { ok: true }
      },

      setOrderPriority: (orderId, priority, manual = true) => {
        get().updateOrder(orderId, {
          priority,
          priorityManual: manual,
        })
        get().addToast(
          manual
            ? `Prioridad manual: ${priority}`
            : `Prioridad automática: ${priority}`,
        )
      },

      addPhotoUrl: (orderId, url) => {
        const trimmed = url.trim()
        if (!trimmed) return
        const order = get().orders.find((o) => o.id === orderId)
        if (!order) return
        const existing = order.photoUrls ?? []
        if (existing.includes(trimmed)) {
          get().addToast('La foto ya está registrada', 'info')
          return
        }
        get().updateOrder(orderId, { photoUrls: [...existing, trimmed] })
        get().addToast('Evidencia fotográfica agregada')
      },

      removePhotoUrl: (orderId, url) => {
        const order = get().orders.find((o) => o.id === orderId)
        if (!order) return
        get().updateOrder(orderId, {
          photoUrls: (order.photoUrls ?? []).filter((u) => u !== url),
        })
      },

      getPhotoAnnotation: (orderId, photoUrl) => {
        const list = get().photoAnnotationsByOrderId[orderId] ?? []
        return list.find((a) => a.photoUrl === photoUrl)
      },

      savePhotoAnnotation: (orderId, photoUrl, strokes) => {
        const entry = {
          photoUrl,
          strokes,
          savedAt: new Date().toISOString(),
        }
        set((state) => {
          const prev = state.photoAnnotationsByOrderId[orderId] ?? []
          const without = prev.filter((a) => a.photoUrl !== photoUrl)
          return {
            photoAnnotationsByOrderId: {
              ...state.photoAnnotationsByOrderId,
              [orderId]: [entry, ...without],
            },
          }
        })
      },

      addThirdParty: (orderId, data) => {
        const order = get().orders.find((o) => o.id === orderId)
        if (!order) throw new Error('Orden no encontrada')
        const entry: ThirdPartyIntervention = {
          id: thirdPartyId(),
          orderId,
          company: data.company.trim(),
          detail: data.detail.trim(),
          photoUrls: data.photoUrls ?? [],
          registeredAt: new Date().toISOString(),
        }
        get().updateOrder(orderId, {
          thirdParties: [entry, ...(order.thirdParties ?? [])],
        })
        get().addToast('Intervención de tercero registrada')
        return entry
      },

      updateThirdParty: (orderId, thirdPartyId, data) => {
        const order = get().orders.find((o) => o.id === orderId)
        if (!order) return
        get().updateOrder(orderId, {
          thirdParties: (order.thirdParties ?? []).map((t) =>
            t.id === thirdPartyId ? { ...t, ...data } : t,
          ),
        })
        get().addToast('Intervención de tercero actualizada')
      },

      getOperatorWorkload: (technicians) => {
        const orders = get().orders
        return technicians.map((tech) => {
          const assigned = orders.filter((o) => {
            if (o.operatorIds?.includes(tech.id)) return true
            if (o.technician === tech.name) return true
            return o.operators?.some((op) => op.id === tech.id) ?? false
          })
          const active = assigned.filter(
            (o) => o.status === 'Pendiente' || o.status === 'En Curso',
          )
          return {
            operatorId: tech.id,
            name: tech.name,
            activeOrders: active.length,
            pendingOrders: assigned.filter((o) => o.status === 'Pendiente').length,
            inProgressOrders: assigned.filter((o) => o.status === 'En Curso')
              .length,
            totalAssigned: assigned.length,
          }
        })
      },

      markPdfGenerated: (orderId) => {
        get().updateOrder(orderId, {
          pdfGeneratedAt: new Date().toISOString(),
        })
      },

      addOrderDocument: (orderId, data) => {
        const order = get().orders.find((o) => o.id === orderId)
        if (!order) throw new Error('Orden no encontrada')
        const now = new Date().toISOString()
        const doc: OrderDocument = {
          id: data.id?.trim() || eventId('doc'),
          orderId,
          kind: data.kind,
          title: data.title.trim(),
          currentVersion: 1,
          createdAt: now,
          versions: [
            {
              version: 1,
              fileName: data.fileName.trim(),
              url: data.url.trim(),
              mimeType: data.mimeType,
              sizeBytes: data.sizeBytes,
              uploadedAt: now,
              uploadedBy: data.uploadedBy,
              note: data.note,
            },
          ],
        }
        get().updateOrder(orderId, {
          documents: [doc, ...(order.documents ?? [])],
        })
        const kindLabel =
          data.kind === 'contrato'
            ? 'Contrato'
            : data.kind === 'reporte'
              ? 'Reporte'
              : 'Documento'
        get().addToast(`${kindLabel} adjunto correctamente`)
        useNotificationsStore.getState().pushOrderActivity({
          orderId,
          title: `Orden ${orderId}: ${kindLabel.toLowerCase()} agregado`,
          message: `Se adjuntó "${data.title.trim()}" a la OT de ${order.client}.`,
        })
        return doc
      },

      addDocumentVersion: (orderId, documentId, data) => {
        const order = get().orders.find((o) => o.id === orderId)
        if (!order) return
        const docs = order.documents ?? []
        const target = docs.find((d) => d.id === documentId)
        if (!target) {
          get().addToast('Documento no encontrado', 'error')
          return
        }
        const nextVersion = target.currentVersion + 1
        const now = new Date().toISOString()
        const updated: OrderDocument = {
          ...target,
          currentVersion: nextVersion,
          versions: [
            {
              version: nextVersion,
              fileName: data.fileName.trim(),
              url: data.url.trim(),
              mimeType: data.mimeType,
              sizeBytes: data.sizeBytes,
              uploadedAt: now,
              uploadedBy: data.uploadedBy,
              note: data.note,
            },
            ...target.versions,
          ],
        }
        get().updateOrder(orderId, {
          documents: docs.map((d) => (d.id === documentId ? updated : d)),
        })
        get().addToast(`Versión ${nextVersion} guardada`)
        useNotificationsStore.getState().pushOrderActivity({
          orderId,
          title: `Orden ${orderId}: documento actualizado`,
          message: `Nueva versión (v${nextVersion}) de "${target.title}" en la OT de ${order.client}.`,
        })
      },

      createFieldOrder: (data) => {
        const id = eventId('OT-T')
        const order: WorkOrder = {
          id,
          client: data.client.trim(),
          address: data.address.trim(),
          service: data.service.trim(),
          category: data.category.trim() || 'Terreno',
          status: 'En Curso',
          createdAt: new Date().toISOString().slice(0, 10),
          priority: 'Media',
          technician: data.technician.trim(),
          operators: data.technician
            ? [{ id: 'field', name: data.technician.trim() }]
            : [],
          progress: 10,
          startDate: new Date().toISOString().slice(0, 10),
        }
        get().addOrder(order)
        if (data.notes?.trim()) {
          get().addToast(`OT en terreno creada: ${id}`)
        } else {
          get().addToast(`OT en terreno creada: ${id}`)
        }
        return order
      },

      completeFieldOrderForm: (orderId, data) => {
        const progress = data.progress
        get().updateOrder(orderId, {
          service: data.service,
          startDate: data.startDate,
          endDate: data.endDate,
          durationHours: data.durationHours,
          progress,
          ...(progress != null && progress >= 100
            ? { status: 'Completada' as const }
            : {}),
        })
        get().addToast('Formulario de terreno actualizado')
      },

      moveOrderOnBoard: (activeId, overId) => {
        const state = get()
        const active = state.orders.find((o) => o.id === activeId)
        if (!active) return

        const overAsColumn = ORDER_STATUSES.find((s) => s === overId)
        const overOrder = state.orders.find((o) => o.id === overId)
        const targetStatus: OrderStatus =
          overAsColumn ?? overOrder?.status ?? active.status

        if (targetStatus === active.status) {
          const column = getColumnOrders(state.orders, targetStatus)
          const oldIndex = column.findIndex((o) => o.id === activeId)
          const newIndex = overOrder
            ? column.findIndex((o) => o.id === overId)
            : column.length - 1

          if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return

          const reordered = arrayMove(column, oldIndex, newIndex)
          const orders = applySortOrderToColumn(
            state.orders,
            targetStatus,
            reordered.map((o) => o.id),
          )
          set({ orders })
          const moved = orders.find((o) => o.id === activeId)
          if (moved) {
            ordersService
              .update(activeId, { sortOrder: moved.sortOrder, status: moved.status })
              .then(() => set({ apiAvailable: true }))
              .catch(() => set({ apiAvailable: false }))
          }
          return
        }

        let orders = state.orders.filter((o) => o.id !== activeId)

        orders = applySortOrderToColumn(
          orders,
          active.status,
          getColumnOrders(orders, active.status).map((o) => o.id),
        )

        let targetColumn = getColumnOrders(orders, targetStatus)
        const moved: WorkOrder = {
          ...active,
          status: targetStatus,
          progress: progressForStatus(targetStatus, active.progress),
        }

        if (overOrder && overOrder.status === targetStatus) {
          const insertAt = targetColumn.findIndex((o) => o.id === overId)
          targetColumn.splice(insertAt, 0, moved)
        } else {
          targetColumn.push(moved)
        }

        orders = [
          ...orders.filter((o) => o.status !== targetStatus),
          ...targetColumn.map((o, i) => ({ ...o, sortOrder: i })),
        ]

        orders = normalizeOrdersSort(orders)

        const selectedOrder =
          state.selectedOrder?.id === activeId
            ? (orders.find((o) => o.id === activeId) ?? null)
            : state.selectedOrder

        set({ orders, selectedOrder })

        if (targetStatus !== active.status) {
          useNotificationsStore.getState().pushOrderStatusChange({
            orderId: active.id,
            client: active.client,
            previousStatus: active.status,
            newStatus: targetStatus,
          })
          const actor = currentHistoryActor()
          get().addModificationHistory(active.id, {
            field: 'status',
            fieldLabel: 'Estado',
            previousValue: active.status,
            newValue: targetStatus,
            changedById: actor.id,
            changedByName: actor.name,
          })
        }

        get().addToast(`Orden movida a "${targetStatus}"`, 'info')
        const movedOrder = orders.find((o) => o.id === activeId)
        if (movedOrder) {
          ordersService
            .update(activeId, {
              sortOrder: movedOrder.sortOrder,
              status: movedOrder.status,
            })
            .then(() => set({ apiAvailable: true }))
            .catch(() => set({ apiAvailable: false }))
        }
      },

      reorderPriorityQueue: (orderedIds) => {
        if (orderedIds.length === 0) return
        const indexById = new Map(orderedIds.map((id, i) => [id, i]))
        set((state) => ({
          orders: state.orders.map((o) => {
            const idx = indexById.get(o.id)
            if (idx === undefined) return o
            return { ...o, queueOrder: idx }
          }),
        }))
        // Persistir posiciones relevantes en API (best-effort)
        orderedIds.forEach((id, i) => {
          void ordersService
            .update(id, { queueOrder: i } as Partial<WorkOrder>)
            .then(() => set({ apiAvailable: true }))
            .catch(() => set({ apiAvailable: false }))
        })
      },

      openCreateModal: () => set({ modalMode: 'create', selectedOrder: null }),
      openEditModal: (order) => set({ modalMode: 'edit', selectedOrder: order }),
      openViewModal: (order) => set({ modalMode: 'view', selectedOrder: order }),
      openDeleteModal: (order) =>
        set({ modalMode: 'delete', selectedOrder: order }),
      openCancelModal: (order) =>
        set({ modalMode: 'cancel', selectedOrder: order }),
      openAnnulModal: (order) =>
        set({ modalMode: 'annul', selectedOrder: order }),
      openRescheduleModal: (order) =>
        set({ modalMode: 'reschedule', selectedOrder: order }),
      openModificationRequestModal: (order) =>
        set({ modalMode: 'modRequest', selectedOrder: order }),

      cancelOrder: (orderId, reason) => {
        const trimmed = reason.trim()
        if (!trimmed) return
        get().updateOrder(orderId, {
          status: 'Cancelada',
          cancelReason: trimmed,
          progress: 0,
        })
        get().addToast('Orden cancelada con éxito')
        set({ modalMode: null, selectedOrder: null })
      },

      annulOrder: (orderId, reason) => {
        const trimmed = reason.trim()
        if (!trimmed) return
        get().updateOrder(orderId, {
          status: 'Cancelada',
          annulled: true,
          annulReason: trimmed,
          progress: 0,
        })
        get().addToast('Orden anulada con éxito')
        set({ modalMode: null, selectedOrder: null })
      },

      registerSupplies: async (orderId, supplies) => {
        const order = get().orders.find((o) => o.id === orderId)
        if (!order) {
          return { ok: false, message: 'Orden de trabajo no encontrada' }
        }
        if (supplies.length === 0) {
          return { ok: false, message: 'Debe ingresar al menos un insumo' }
        }

        const inventory = useInventoryStore.getState()

        for (const item of supplies) {
          const product = inventory.products.find((p) => p.id === item.productId)
          if (!product) {
            return { ok: false, message: `Insumo "${item.productName}" no encontrado` }
          }
          if (item.quantity <= 0) {
            return { ok: false, message: 'La cantidad debe ser mayor a cero' }
          }
          if (product.currentStock < item.quantity) {
            return {
              ok: false,
              message: `Stock insuficiente para "${product.name}": disponible ${product.currentStock}, solicitado ${item.quantity}`,
            }
          }
        }

        const now = new Date().toLocaleString('es-CL')
        const entries: OrderSupplyUsage[] = supplies.map((s) => ({
          ...s,
          registeredAt: now,
        }))

        for (const item of supplies) {
          const result = await useInventoryStore
            .getState()
            .deductStock(item.productId, item.quantity, orderId)
          if (!result.ok) {
            return {
              ok: false,
              message:
                result.message ??
                `No se pudo descontar stock de "${item.productName}"`,
            }
          }
        }

        const existing = order.suppliesUsed ?? []
        get().updateOrder(orderId, { suppliesUsed: [...entries, ...existing] })
        get().addToast('Insumos registrados y stock de inventario actualizado')
        return { ok: true }
      },

      removeRegisteredSupply: async (orderId, supplyIndex) => {
        const order = get().orders.find((o) => o.id === orderId)
        if (!order) {
          return { ok: false, message: 'Orden de trabajo no encontrada' }
        }
        const supplies = order.suppliesUsed ?? []
        if (supplyIndex < 0 || supplyIndex >= supplies.length) {
          return { ok: false, message: 'Registro de insumo no encontrado' }
        }

        const entry = supplies[supplyIndex]
        const restore = await useInventoryStore
          .getState()
          .restoreStock(entry.productId, entry.quantity, orderId)
        if (!restore.ok) {
          return {
            ok: false,
            message:
              restore.message ??
              `No se pudo devolver stock de "${entry.productName}"`,
          }
        }

        const next = supplies.filter((_, i) => i !== supplyIndex)
        get().updateOrder(orderId, { suppliesUsed: next })
        get().addToast(
          `Insumo "${entry.productName}" eliminado y stock devuelto a bodega`,
        )
        return { ok: true }
      },

      approveOrder: (orderId, approval) => {
        const order = get().orders.find((o) => o.id === orderId)
        if (!order) {
          return { ok: false, message: 'Orden de trabajo no encontrada' }
        }
        if (order.status !== 'Completada') {
          return {
            ok: false,
            message: 'Solo se pueden aprobar órdenes con estado Completada',
          }
        }
        if (order.approval) {
          return { ok: false, message: 'Esta orden ya fue aprobada' }
        }

        const checks = [
          Boolean(order.client),
          Boolean(order.address),
          Boolean(order.startDate || order.createdAt),
          Boolean(order.operators?.length || order.technician),
          Boolean(order.service || order.category),
        ]
        if (!checks.every(Boolean)) {
          return {
            ok: false,
            message: 'La orden no cumple con todos los antecedentes requeridos',
          }
        }

        const record: OrderApprovalRecord = {
          approvedAt: approval.approvedAt ?? new Date().toISOString(),
          approvedBy: approval.approvedBy,
          approvedByName: approval.approvedByName,
        }
        get().updateOrder(orderId, { approval: record })
        get().addToast('Orden de trabajo aprobada correctamente')
        return { ok: true }
      },

      addOrderComment: async (orderId, content, author) => {
        const trimmed = content.trim()
        if (!trimmed) {
          return { ok: false, message: 'El comentario no puede estar vacío' }
        }
        const order = get().orders.find((o) => o.id === orderId)
        if (!order) {
          return { ok: false, message: 'Orden de trabajo no encontrada' }
        }
        try {
          const comment = await ordersService.createComment(
            orderId,
            trimmed,
            author.name,
          )
          set((state) => ({
            commentsByOrderId: {
              ...state.commentsByOrderId,
              [orderId]: [comment, ...(state.commentsByOrderId[orderId] ?? [])],
            },
            apiAvailable: true,
          }))
          useNotificationsStore.getState().pushOrderActivity({
            orderId,
            title: `Orden ${orderId}: nuevo comentario`,
            message: `${author.name} comentó en la OT de ${order.client}: "${trimmed.slice(0, 120)}${trimmed.length > 120 ? '…' : ''}"`,
          })
          return { ok: true }
        } catch (err) {
          const message =
            err instanceof Error ? err.message : 'No se pudo guardar el comentario'
          return { ok: false, message }
        }
      },

      fetchOrderComments: async (orderId) => {
        try {
          const comments = await ordersService.listComments(orderId)
          set((state) => ({
            commentsByOrderId: {
              ...state.commentsByOrderId,
              [orderId]: comments,
            },
            apiAvailable: true,
          }))
          return comments
        } catch {
          set({ apiAvailable: false })
          return get().commentsByOrderId[orderId] ?? []
        }
      },

      getOrderComments: (orderId) => {
        const list = get().commentsByOrderId[orderId] ?? []
        return [...list].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
      },

      validateReschedule: (orderId, newDate) => {
        const order = get().orders.find((o) => o.id === orderId)
        if (!order) return { available: false, reasons: ['Orden no encontrada'] }
        const products = useInventoryStore.getState().products
        const equipment = useEquipmentStore.getState().equipment
        return validateRescheduleDate(order, newDate, get().orders, products, equipment)
      },

      rescheduleOrder: async (orderId, newDate, user) => {
        const order = get().orders.find((o) => o.id === orderId)
        if (!order) return { ok: false, message: 'Orden de trabajo no encontrada' }
        const validation = get().validateReschedule(orderId, newDate)
        if (!validation.available) {
          return {
            ok: false,
            message: validation.reasons[0] ?? 'Fecha no disponible',
          }
        }
        const previousDate = getExecutionDate(order) || order.createdAt

        let event: OrderRescheduleEvent = {
          id: eventId('rs'),
          orderId,
          previousDate,
          newDate,
          changedById: user.id,
          changedByName: user.name,
          changedAt: new Date().toISOString(),
        }

        try {
          event = await ordersService.createReschedule(orderId, {
            previousDate,
            newDate,
            changedById: user.id,
            changedByName: user.name,
          })
          set({ apiAvailable: true })
        } catch {
          set({ apiAvailable: false })
          return {
            ok: false,
            message: 'No se pudo guardar la reprogramación en el servidor',
          }
        }

        get().updateOrder(orderId, {
          executionDate: newDate,
          startDate: newDate,
          dueDate: newDate,
        })
        set((state) => ({
          rescheduleHistoryByOrderId: {
            ...state.rescheduleHistoryByOrderId,
            [orderId]: [
              event,
              ...(state.rescheduleHistoryByOrderId[orderId] ?? []).filter(
                (e) => e.id !== event.id,
              ),
            ],
          },
          modalMode: null,
          selectedOrder: null,
        }))
        get().addToast('Fecha de ejecución reprogramada correctamente')
        useNotificationsStore.getState().pushOrderActivity({
          orderId,
          title: `Orden ${orderId}: reprogramada`,
          message: `${user.name} movió la OT de ${order.client} de ${previousDate} a ${newDate}.`,
        })
        return { ok: true }
      },

      getRescheduleHistory: (orderId) => {
        const list = get().rescheduleHistoryByOrderId[orderId] ?? []
        return [...list].sort(
          (a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime(),
        )
      },

      fetchRescheduleHistory: async (orderId) => {
        try {
          const list = await ordersService.listReschedules(orderId)
          set((state) => ({
            rescheduleHistoryByOrderId: {
              ...state.rescheduleHistoryByOrderId,
              [orderId]: list,
            },
            apiAvailable: true,
          }))
          return list
        } catch {
          set({ apiAvailable: false })
          return get().getRescheduleHistory(orderId)
        }
      },

      submitModificationRequest: async (orderId, data, operator) => {
        const order = get().orders.find((o) => o.id === orderId)
        if (!order) return { ok: false, message: 'Orden no encontrada' }
        if (!data.fieldsToModify.trim() || !data.reason.trim()) {
          return { ok: false, message: 'Complete campos y motivo de la solicitud' }
        }

        const localRequest: OrderModificationRequest = {
          id: eventId('mr'),
          orderId,
          operatorId: operator.id,
          operatorName: operator.name,
          fieldsToModify: data.fieldsToModify.trim(),
          reason: data.reason.trim(),
          status: 'Pendiente',
          requestedAt: new Date().toISOString(),
        }

        try {
          const created = await ordersService.createModificationRequest(orderId, {
            fieldsToModify: localRequest.fieldsToModify,
            reason: localRequest.reason,
            operatorId: operator.id,
            operatorName: operator.name,
          })
          set((state) => ({
            modificationRequests: [created, ...state.modificationRequests],
            modalMode: null,
            selectedOrder: null,
            apiAvailable: true,
          }))
        } catch {
          set((state) => ({
            modificationRequests: [localRequest, ...state.modificationRequests],
            modalMode: null,
            selectedOrder: null,
            apiAvailable: false,
          }))
        }

        get().addToast('Solicitud de modificación enviada — pendiente de aprobación')
        return { ok: true }
      },

      approveModificationRequest: async (requestId, reviewer) => {
        const request = get().modificationRequests.find((r) => r.id === requestId)
        if (!request) return { ok: false, message: 'Solicitud no encontrada' }
        if (request.status !== 'Pendiente') {
          return { ok: false, message: 'La solicitud ya fue revisada' }
        }

        const applyLocal = (status: 'Aprobada', extra?: Partial<OrderModificationRequest>) => {
          set((state) => ({
            modificationRequests: state.modificationRequests.map((r) =>
              r.id === requestId
                ? {
                    ...r,
                    status,
                    reviewedById: reviewer.id,
                    reviewedByName: reviewer.name,
                    reviewedAt: new Date().toISOString(),
                    ...extra,
                  }
                : r,
            ),
          }))
        }

        try {
          const updated = await ordersService.approveModificationRequest(requestId, {
            reviewerId: reviewer.id,
            reviewerName: reviewer.name,
          })
          set((state) => ({
            modificationRequests: state.modificationRequests.map((r) =>
              r.id === requestId ? updated : r,
            ),
            apiAvailable: true,
          }))
        } catch (err) {
          const message =
            err && typeof err === 'object' && 'response' in err
              ? String(
                  (err as { response?: { data?: { error?: string } } }).response?.data
                    ?.error ?? '',
                )
              : ''
          if (message) return { ok: false, message }
          applyLocal('Aprobada')
          set({ apiAvailable: false })
        }

        get().addToast('Solicitud aprobada — el operador puede editar la orden')
        return { ok: true }
      },

      rejectModificationRequest: async (requestId, reason, reviewer) => {
        const trimmed = reason.trim()
        if (!trimmed) return { ok: false, message: 'Indique el motivo del rechazo' }
        const request = get().modificationRequests.find((r) => r.id === requestId)
        if (!request) return { ok: false, message: 'Solicitud no encontrada' }
        if (request.status !== 'Pendiente') {
          return { ok: false, message: 'La solicitud ya fue revisada' }
        }

        try {
          const updated = await ordersService.rejectModificationRequest(requestId, {
            reason: trimmed,
            reviewerId: reviewer.id,
            reviewerName: reviewer.name,
          })
          set((state) => ({
            modificationRequests: state.modificationRequests.map((r) =>
              r.id === requestId ? updated : r,
            ),
            apiAvailable: true,
          }))
        } catch (err) {
          const message =
            err && typeof err === 'object' && 'response' in err
              ? String(
                  (err as { response?: { data?: { error?: string } } }).response?.data
                    ?.error ?? '',
                )
              : ''
          if (message) return { ok: false, message }
          set((state) => ({
            modificationRequests: state.modificationRequests.map((r) =>
              r.id === requestId
                ? {
                    ...r,
                    status: 'Rechazada' as const,
                    rejectionReason: trimmed,
                    reviewedById: reviewer.id,
                    reviewedByName: reviewer.name,
                    reviewedAt: new Date().toISOString(),
                  }
                : r,
            ),
            apiAvailable: false,
          }))
        }

        get().addToast('Solicitud rechazada', 'info')
        return { ok: true }
      },

      getModificationHistory: (orderId) => {
        const list = get().modificationHistoryByOrderId[orderId] ?? []
        return [...list].sort(
          (a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime(),
        )
      },

      fetchModificationHistory: async (orderId) => {
        try {
          const list = await ordersService.listModificationHistory(orderId)
          set((state) => ({
            modificationHistoryByOrderId: {
              ...state.modificationHistoryByOrderId,
              [orderId]: list,
            },
            apiAvailable: true,
          }))
          return list
        } catch {
          set({ apiAvailable: false })
          return get().getModificationHistory(orderId)
        }
      },

      addModificationHistory: (orderId, entry) => {
        const record: OrderModificationHistoryEntry = {
          ...entry,
          id: eventId('mh'),
          orderId,
          changedAt: new Date().toISOString(),
        }
        set((state) => ({
          modificationHistoryByOrderId: {
            ...state.modificationHistoryByOrderId,
            [orderId]: [
              record,
              ...(state.modificationHistoryByOrderId[orderId] ?? []),
            ],
          },
        }))
        void ordersService
          .addModificationHistory(orderId, entry)
          .then((saved) => {
            set((state) => ({
              modificationHistoryByOrderId: {
                ...state.modificationHistoryByOrderId,
                [orderId]: [
                  saved,
                  ...(state.modificationHistoryByOrderId[orderId] ?? []).filter(
                    (h) => h.id !== record.id,
                  ),
                ],
              },
              apiAvailable: true,
            }))
          })
          .catch(() => set({ apiAvailable: false }))
      },

      closeModal: () => set({ modalMode: null, selectedOrder: null }),

      setStatusFilter: (status) => set({ statusFilter: status }),
      setUrgencyFilter: (filter) => set({ urgencyFilter: filter }),
      toggleFilters: () => set((state) => ({ showFilters: !state.showFilters })),

      addToast: (message, type = 'success') => {
        const id = ++toastId
        set((state) => ({ toasts: [...state.toasts, { id, message, type }] }))
        setTimeout(() => {
          useOrdersStore.getState().removeToast(id)
        }, 3500)
      },

      removeToast: (id) =>
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
    }),
    {
      name: 'camus_orders_store_v5',
      partialize: (state) => ({
        serviceClocks: state.serviceClocks,
        interventionsByOrderId: state.interventionsByOrderId,
        photoAnnotationsByOrderId: state.photoAnnotationsByOrderId,
      }),
      merge: (persisted, current) => {
        const p = persisted as Partial<OrdersState> | undefined
        return {
          ...current,
          ...p,
          // Órdenes y comentarios siempre desde Postgres (syncFromApi)
          orders: current.orders,
          commentsByOrderId: current.commentsByOrderId,
          interventionsByOrderId:
            p?.interventionsByOrderId ?? current.interventionsByOrderId,
          rescheduleHistoryByOrderId: current.rescheduleHistoryByOrderId,
          modificationRequests: current.modificationRequests,
          modificationHistoryByOrderId: current.modificationHistoryByOrderId,
          serviceClocks: {
            ...(p?.serviceClocks ?? {}),
          },
        }
      },
    },
  ),
)
