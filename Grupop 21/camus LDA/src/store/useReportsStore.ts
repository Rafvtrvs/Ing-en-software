import { create } from 'zustand'
import type { ReportPeriod, ReportTab } from '@/types'

export interface ToastMessage {
  id: number
  type: 'success' | 'error' | 'info'
  message: string
}

interface ReportsState {
  activeTab: ReportTab
  period: ReportPeriod
  toasts: ToastMessage[]
  setActiveTab: (tab: ReportTab) => void
  setPeriod: (period: ReportPeriod) => void
  addToast: (message: string, type?: ToastMessage['type']) => void
  removeToast: (id: number) => void
}

let toastId = 0

export const useReportsStore = create<ReportsState>()((set) => ({
  activeTab: 'resumen',
  period: 'month',
  toasts: [],

  setActiveTab: (tab) => set({ activeTab: tab }),
  setPeriod: (period) => set({ period }),

  addToast: (message, type = 'success') => {
    const id = ++toastId
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }))
    setTimeout(() => {
      useReportsStore.getState().removeToast(id)
    }, 3500)
  },

  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}))
