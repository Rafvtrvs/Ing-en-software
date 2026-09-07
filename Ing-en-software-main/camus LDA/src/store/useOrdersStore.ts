import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { arrayMove } from '@dnd-kit/sortable'
import type {
  OrderIntervention,
  OrderOperator,
  OrderPriority,
  OrderStatus,
  ThirdPartyIntervention,
  WorkOrder,
} from '@/types'
import { initialOrders } from '@/data/mock/orders'
import { ordersService } from '@/services/ordersService'
import {
  applySortOrderToColumn,
  getColumnOrders,
  normalizeOrdersSort,
  ORDER_STATUSES,
} from '@/features/orders/utils/orderSort'
import { useNotificationsStore } from '@/store/useNotificationsStore'
import { getOrderFieldChanges } from '@/features/orders/utils/orderFieldChanges'
import { calcDurationHours } from '@/features/orders/utils/orderDates'
import {
  resolveOrderPriority,
} from '@/features/orders/utils/priorityRules'

export type OrderModalMode = 'create' | 'edit' | 'view' | 'delete' | null

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

interface OrdersState {
  orders: WorkOrder[]
  apiAvailable: boolean
  /** Intervenciones locales por OT (fallback / caché CU-149–151) */
  interventionsByOrderId: Record<string, OrderIntervention[]>
  modalMode: OrderModalMode
  selectedOrder: WorkOrder | null
  statusFilter: OrderStatus | 'all'
  /** Filtro urgencia dashboard/listado (CU-172 / CU-177) */
  urgencyFilter: 'all' | 'urgent'
  showFilters: boolean
  toasts: ToastMessage[]
  syncFromApi: () => Promise<void>
  addOrder: (order: WorkOrder) => void
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
    dates: { startDate?: string; endDate?: string; durationHours?: number },
  ) => void
  setOrderPriority: (
    orderId: string,
    priority: OrderPriority,
    manual?: boolean,
  ) => void
  addPhotoUrl: (orderId: string, url: string) => void
  removePhotoUrl: (orderId: string, url: string) => void
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
  moveOrderOnBoard: (activeId: string, overId: string) => void
  /** Reordena la cola de atención por IDs en el nuevo orden visual */
  reorderPriorityQueue: (orderedIds: string[]) => void
  openCreateModal: () => void
  openEditModal: (order: WorkOrder) => void
  openViewModal: (order: WorkOrder) => void
  openDeleteModal: (order: WorkOrder) => void
  closeModal: () => void
  setStatusFilter: (status: OrderStatus | 'all') => void
  setUrgencyFilter: (filter: 'all' | 'urgent') => void
  toggleFilters: () => void
  addToast: (message: string, type?: ToastMessage['type']) => void
  removeToast: (id: number) => void
}

let toastId = 0

function safeId(prefix = 'OT') {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    const short = crypto.randomUUID().split('-')[0].toUpperCase()
    return `${prefix}-${short}`
  }
  return `${prefix}-${Date.now()}`
}

function thirdPartyId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `tp-${crypto.randomUUID().split('-')[0]}`
  }
  return `tp-${Date.now()}`
}

const seededOrders = normalizeOrdersSort(
  initialOrders.map((o, i) => ({ ...o, sortOrder: o.sortOrder ?? i })),
)

function progressForStatus(
  status: OrderStatus,
  current?: number,
): number | undefined {
  if (status === 'Completada') return 100
  if (status === 'En Curso') return Math.max(current ?? 0, 10)
  if (status === 'Pendiente') return current ?? 0
  return current
}

/** Conserva extras frontend-only al sincronizar desde API */
function mergeApiOrders(
  apiOrders: WorkOrder[],
  localOrders: WorkOrder[],
): WorkOrder[] {
  const localById = new Map(localOrders.map((o) => [o.id, o]))
  const merged = apiOrders.map((api) => {
    const local = localById.get(api.id)
    if (!local) return api
    return {
      ...api,
      technician: api.technician || local.technician,
      operatorIds: api.operatorIds?.length ? api.operatorIds : local.operatorIds,
      operators: api.operators?.length ? api.operators : local.operators,
      startDate: local.startDate ?? api.startDate,
      endDate: local.endDate ?? api.endDate,
      durationHours: local.durationHours ?? api.durationHours,
      incidentType: local.incidentType ?? api.incidentType,
      priorityManual: local.priorityManual ?? api.priorityManual,
      photoUrls: local.photoUrls ?? api.photoUrls,
      thirdParties: local.thirdParties ?? api.thirdParties,
      truckCode: local.truckCode ?? api.truckCode,
      equipmentId: local.equipmentId ?? api.equipmentId,
      pdfGeneratedAt: local.pdfGeneratedAt ?? api.pdfGeneratedAt,
      queueOrder: local.queueOrder ?? api.queueOrder,
      priority: local.priorityManual
        ? local.priority
        : (api.priority ?? local.priority),
    }
  })
  const apiIds = new Set(apiOrders.map((o) => o.id))
  const localOnly = localOrders.filter((o) => !apiIds.has(o.id))
  return [...merged, ...localOnly]
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
      orders: seededOrders,
      apiAvailable: false,
      interventionsByOrderId: {},
      modalMode: null,
      selectedOrder: null,
      statusFilter: 'all',
      urgencyFilter: 'all',
      showFilters: false,
      toasts: [],

      syncFromApi: async () => {
        try {
          const orders = await ordersService.list()
          const merged = mergeApiOrders(orders, get().orders)
          set({ orders: normalizeOrdersSort(merged), apiAvailable: true })
        } catch {
          set({ apiAvailable: false })
        }
      },

      addOrder: (order) => {
        const newId = order.id || safeId()
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
      },

      updateOrder: (id, data, options) => {
        const existing = get().orders.find((o) => o.id === id)
        const enriched = withDerivedDuration(data, existing)
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
              useNotificationsStore.getState().pushOrderFieldChanges({
                orderId: existing.id,
                client: merged.client,
                changes,
              })
            }
          } else if (data.status && data.status !== existing.status) {
            useNotificationsStore.getState().pushOrderStatusChange({
              orderId: existing.id,
              client: existing.client,
              previousStatus: existing.status,
              newStatus: data.status,
            })
          }
        }

        ordersService
          .update(id, enriched)
          .then(() => set({ apiAvailable: true }))
          .catch(() => set({ apiAvailable: false }))
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
      },

      /** Reasignar: revoca permisos previos al reemplazar operatorIds (CU-161 / CU-187) */
      reassignOperators: (orderId, operators) => {
        const technician = operators[0]?.name ?? ''
        get().updateOrder(orderId, {
          operatorIds: operators.map((o) => o.id),
          operators,
          technician,
        })
        get().addToast('Operadores reasignados — permisos previos revocados', 'info')
      },

      setOrderDates: (orderId, dates) => {
        get().updateOrder(orderId, dates)
        get().addToast('Fechas de la orden actualizadas')
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
      name: 'camus_orders_store_v2',
      partialize: (state) => ({
        orders: state.orders,
        interventionsByOrderId: state.interventionsByOrderId,
      }),
      merge: (persisted, current) => {
        const p = persisted as Partial<OrdersState> | undefined
        const orders = normalizeOrdersSort(p?.orders ?? current.orders)
        return {
          ...current,
          ...p,
          orders,
          interventionsByOrderId:
            p?.interventionsByOrderId ?? current.interventionsByOrderId,
        }
      },
    },
  ),
)
