import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { FieldTechnician } from '@/types'
import { fieldTechnicians as initialTechnicians } from '@/data/mock/operations'

export interface ToastMessage {
  id: number
  type: 'success' | 'error' | 'info'
  message: string
}

interface OperationsState {
  technicians: FieldTechnician[]
  toasts: ToastMessage[]
  updateTechnicianProgress: (id: string, progress: number) => void
  addToast: (message: string, type?: ToastMessage['type']) => void
  removeToast: (id: number) => void
}

let toastId = 0

export const useOperationsStore = create<OperationsState>()(
  persist(
    (set) => ({
      technicians: initialTechnicians,
      toasts: [],

      updateTechnicianProgress: (id, progress) =>
        set((state) => ({
          technicians: state.technicians.map((t) =>
            t.id === id ? { ...t, progress } : t,
          ),
        })),

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
      name: 'camus_operations_store_v1',
      partialize: (state) => ({ technicians: state.technicians }),
    },
  ),
)
