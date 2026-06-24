import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { initialNotifications } from '@/data/mock/notifications'
import { ROUTES } from '@/constants/routes'
import { useAppStore } from '@/store/useAppStore'
import type { AppNotification, OrderStatus } from '@/types'
import type { OrderFieldChange } from '@/features/orders/utils/orderFieldChanges'
import { formatOrderChangesMessage } from '@/features/orders/utils/orderFieldChanges'

interface NotificationsState {
  items: AppNotification[]
  panelOpen: boolean
  unreadCount: () => number
  togglePanel: () => void
  closePanel: () => void
  addNotification: (notification: Omit<AppNotification, 'id' | 'read' | 'createdAt'>) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  pushOrderStatusChange: (payload: {
    orderId: string
    client: string
    previousStatus: OrderStatus
    newStatus: OrderStatus
  }) => void
  pushOrderFieldChanges: (payload: {
    orderId: string
    client: string
    changes: OrderFieldChange[]
  }) => void
  pushOrderCreated: (payload: {
    orderId: string
    client: string
    service?: string
    status: OrderStatus
  }) => void
  pushProductCreated: (payload: {
    code: string
    name: string
    category: string
  }) => void
}

function syncHeaderBadge(count: number) {
  useAppStore.setState((state) => ({
    user: { ...state.user, notifications: count },
  }))
}

function safeId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `notif-${crypto.randomUUID().split('-')[0]}`
  }
  return `notif-${Date.now()}`
}

export const useNotificationsStore = create<NotificationsState>()(
  persist(
    (set, get) => ({
      items: initialNotifications,
      panelOpen: false,

      unreadCount: () => get().items.filter((n) => !n.read).length,

      togglePanel: () => set((state) => ({ panelOpen: !state.panelOpen })),

      closePanel: () => set({ panelOpen: false }),

      addNotification: (notification) => {
        const item: AppNotification = {
          ...notification,
          id: safeId(),
          read: false,
          createdAt: new Date().toISOString(),
        }
        set((state) => {
          const items = [item, ...state.items].slice(0, 50)
          syncHeaderBadge(items.filter((n) => !n.read).length)
          return { items, panelOpen: true }
        })
      },

      markAsRead: (id) => {
        set((state) => {
          const items = state.items.map((n) =>
            n.id === id ? { ...n, read: true } : n,
          )
          syncHeaderBadge(items.filter((n) => !n.read).length)
          return { items }
        })
      },

      markAllAsRead: () => {
        set((state) => {
          const items = state.items.map((n) => ({ ...n, read: true }))
          syncHeaderBadge(0)
          return { items }
        })
      },

      pushOrderStatusChange: ({ orderId, client, previousStatus, newStatus }) => {
        get().addNotification({
          title: `Orden ${orderId} actualizada`,
          message: `La orden de ${client} cambió de "${previousStatus}" a "${newStatus}".`,
          type: 'order',
          orderId,
          link: ROUTES.ORDENES,
        })
      },

      pushOrderFieldChanges: ({ orderId, client, changes }) => {
        if (changes.length === 0) return

        const detail = formatOrderChangesMessage(changes)
        const title =
          changes.length === 1
            ? `Orden ${orderId}: ${changes[0].label} modificado`
            : `Orden ${orderId}: ${changes.length} campos modificados`

        get().addNotification({
          title,
          message: `La orden de ${client} — ${detail}`,
          type: 'order',
          orderId,
          link: ROUTES.ORDENES,
        })
      },

      pushOrderCreated: ({ orderId, client, service, status }) => {
        const detail = service ? ` — ${service}` : ''
        get().addNotification({
          title: `Nueva orden ${orderId}`,
          message: `Se creó una orden para ${client}${detail} (estado: ${status}).`,
          type: 'order',
          orderId,
          link: ROUTES.ORDENES,
        })
      },

      pushProductCreated: ({ code, name, category }) => {
        get().addNotification({
          title: `Producto ${code} registrado`,
          message: `Se agregó "${name}" a inventario en la categoría ${category}.`,
          type: 'inventory',
          link: ROUTES.INVENTARIO,
        })
      },
    }),
    {
      name: 'camus_notifications_store_v1',
      partialize: (state) => ({ items: state.items }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          syncHeaderBadge(state.items.filter((n) => !n.read).length)
        }
      },
    },
  ),
)
