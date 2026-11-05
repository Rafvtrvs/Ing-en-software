import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ToastMessage {
  id: number
  type: 'success' | 'error' | 'info'
  message: string
}

interface OperationsState {
  lastAutoSyncAt: string | null
  toasts: ToastMessage[]
  setLastAutoSyncAt: (value: string | null) => void
  addToast: (message: string, type?: ToastMessage['type']) => void
  removeToast: (id: number) => void
}

let toastId = 0

export const useOperationsStore = create<OperationsState>()(
  persist(
    (set) => ({
      lastAutoSyncAt: null,
      toasts: [],

      setLastAutoSyncAt: (value) => set({ lastAutoSyncAt: value }),

      addToast: (message, type = 'success') => {
        const id = ++toastId
        set((state) => ({ toasts: [...state.toasts, { id, message, type }] }))
        setTimeout(() => {
          useOperationsStore.getState().removeToast(id)
        }, 3500)
      },

      removeToast: (id) =>
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
    }),
    {
      name: 'camus_operations_store_v5',
      partialize: (state) => ({
        lastAutoSyncAt: state.lastAutoSyncAt,
      }),
    },
  ),
)
