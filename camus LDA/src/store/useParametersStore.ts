import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { defaultSystemParameters } from '@/data/mock/parameters'
import type {
  BillingParameters,
  GeneralParameters,
  InventoryParameters,
  NotificationParameters,
  OperationParameters,
  OrderParameters,
  ParametersTab,
  SystemParameters,
} from '@/types'

export interface ToastMessage {
  id: number
  type: 'success' | 'error' | 'info'
  message: string
}

interface ParametersState {
  parameters: SystemParameters
  activeTab: ParametersTab
  toasts: ToastMessage[]
  setActiveTab: (tab: ParametersTab) => void
  updateGeneral: (data: Partial<GeneralParameters>) => void
  updateOrders: (data: Partial<OrderParameters>) => void
  updateBilling: (data: Partial<BillingParameters>) => void
  updateInventory: (data: Partial<InventoryParameters>) => void
  updateNotifications: (data: Partial<NotificationParameters>) => void
  updateOperations: (data: Partial<OperationParameters>) => void
  resetToDefaults: () => void
  addToast: (message: string, type?: ToastMessage['type']) => void
  removeToast: (id: number) => void
}

let toastId = 0

export const useParametersStore = create<ParametersState>()(
  persist(
    (set) => ({
      parameters: defaultSystemParameters,
      activeTab: 'general',
      toasts: [],

      setActiveTab: (tab) => set({ activeTab: tab }),

      updateGeneral: (data) =>
        set((state) => ({
          parameters: {
            ...state.parameters,
            general: { ...state.parameters.general, ...data },
          },
        })),

      updateOrders: (data) =>
        set((state) => ({
          parameters: {
            ...state.parameters,
            orders: { ...state.parameters.orders, ...data },
          },
        })),

      updateBilling: (data) =>
        set((state) => ({
          parameters: {
            ...state.parameters,
            billing: { ...state.parameters.billing, ...data },
          },
        })),

      updateInventory: (data) =>
        set((state) => ({
          parameters: {
            ...state.parameters,
            inventory: { ...state.parameters.inventory, ...data },
          },
        })),

      updateNotifications: (data) =>
        set((state) => ({
          parameters: {
            ...state.parameters,
            notifications: { ...state.parameters.notifications, ...data },
          },
        })),

      updateOperations: (data) =>
        set((state) => ({
          parameters: {
            ...state.parameters,
            operations: { ...state.parameters.operations, ...data },
          },
        })),

      resetToDefaults: () => set({ parameters: defaultSystemParameters }),

      addToast: (message, type = 'success') => {
        const id = ++toastId
        set((state) => ({ toasts: [...state.toasts, { id, message, type }] }))
        setTimeout(() => {
          useParametersStore.getState().removeToast(id)
        }, 3500)
      },

      removeToast: (id) =>
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
    }),
    {
      name: 'camus_parameters_store_v1',
      partialize: (state) => ({ parameters: state.parameters }),
    },
  ),
)
