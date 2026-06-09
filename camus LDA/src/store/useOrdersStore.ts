import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { arrayMove } from '@dnd-kit/sortable'
import type { OrderStatus, WorkOrder } from '@/types'
import { initialOrders } from '@/data/mock/orders'
import { ordersService } from '@/services/ordersService'
import {
  applySortOrderToColumn,
  getColumnOrders,
  normalizeOrdersSort,
  ORDER_STATUSES,
} from '@/features/orders/utils/orderSort'

export type OrderModalMode = 'create' | 'edit' | 'view' | 'delete' | null

export interface ToastMessage {
  id: number
  type: 'success' | 'error' | 'info'
  message: string
}

interface OrdersState {
  orders: WorkOrder[]
  apiAvailable: boolean
  modalMode: OrderModalMode
  selectedOrder: WorkOrder | null
  statusFilter: OrderStatus | 'all'
  showFilters: boolean
  toasts: ToastMessage[]
  syncFromApi: () => Promise<void>
  addOrder: (order: WorkOrder) => void
  updateOrder: (id: string, data: Partial<WorkOrder>) => void
  deleteOrder: (id: string) => void
  moveOrderOnBoard: (activeId: string, overId: string) => void
  openCreateModal: () => void
  openEditModal: (order: WorkOrder) => void
  openViewModal: (order: WorkOrder) => void
  openDeleteModal: (order: WorkOrder) => void
  closeModal: () => void
  setStatusFilter: (status: OrderStatus | 'all') => void
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

export const useOrdersStore = create<OrdersState>()(
  persist(
    (set, get) => ({
      orders: seededOrders,
      apiAvailable: false,
      modalMode: null,
      selectedOrder: null,
      statusFilter: 'all',
      showFilters: false,
      toasts: [],

      // Carga las órdenes desde el backend (PostgreSQL). Si no responde,
      // se conservan los datos locales.
      syncFromApi: async () => {
        try {
          const orders = await ordersService.list()
          set({ orders: normalizeOrdersSort(orders), apiAvailable: true })
        } catch {
          set({ apiAvailable: false })
        }
      },

      addOrder: (order) => {
        const newId = order.id || safeId()
        set((state) => {
          const status = order.status
          const column = getColumnOrders(state.orders, status)
          const bumped = column.map((o, i) => ({ ...o, sortOrder: i + 1 }))
          const bumpedIds = new Set(bumped.map((o) => o.id))
          const orders = state.orders.map((o) =>
            bumpedIds.has(o.id) ? bumped.find((b) => b.id === o.id)! : o,
          )
          const newOrder: WorkOrder = { ...order, id: newId, sortOrder: 0 }
          return { orders: [newOrder, ...orders] }
        })
        ordersService
          .create({ ...order, id: newId, sortOrder: 0 })
          .then(() => set({ apiAvailable: true }))
          .catch(() => set({ apiAvailable: false }))
      },

      updateOrder: (id, data) => {
        set((state) => {
          const orders = state.orders.map((o) =>
            o.id === id ? { ...o, ...data } : o,
          )
          const selectedOrder =
            state.selectedOrder?.id === id
              ? { ...state.selectedOrder, ...data }
              : state.selectedOrder
          return { orders, selectedOrder }
        })
        ordersService
          .update(id, data)
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
          return {
            orders,
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

      moveOrderOnBoard: (activeId, overId) => {
        const state = get()
        const active = state.orders.find((o) => o.id === activeId)
        if (!active) return

        const overAsColumn = ORDER_STATUSES.find((s) => s === overId)
        const overOrder = state.orders.find((o) => o.id === overId)
        const targetStatus: OrderStatus =
          overAsColumn ?? overOrder?.status ?? active.status

        // Reordenar dentro de la misma columna
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

        // Mover a otra columna
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

      openCreateModal: () => set({ modalMode: 'create', selectedOrder: null }),
      openEditModal: (order) => set({ modalMode: 'edit', selectedOrder: order }),
      openViewModal: (order) => set({ modalMode: 'view', selectedOrder: order }),
      openDeleteModal: (order) =>
        set({ modalMode: 'delete', selectedOrder: order }),
      closeModal: () => set({ modalMode: null, selectedOrder: null }),

      setStatusFilter: (status) => set({ statusFilter: status }),
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
      name: 'camus_orders_store_v1',
      partialize: (state) => ({ orders: state.orders }),
      merge: (persisted, current) => {
        const p = persisted as Partial<OrdersState> | undefined
        const orders = normalizeOrdersSort(p?.orders ?? current.orders)
        return { ...current, ...p, orders }
      },
    },
  ),
)
