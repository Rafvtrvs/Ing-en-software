import { create } from 'zustand'
import type { ReportPeriod, ReportTab } from '@/types'

export interface ToastMessage {
  id: number
  type: 'success' | 'error' | 'info'
  message: string
}

export interface ThirdPartyReportFilters {
  companyFilter: string
  orderFilter: string
  search: string
}

interface ReportsState {
  activeTab: ReportTab
  period: ReportPeriod
  thirdPartyFilters: ThirdPartyReportFilters
  thirdPartyHasFiltered: boolean
  toasts: ToastMessage[]
  setActiveTab: (tab: ReportTab) => void
  setPeriod: (period: ReportPeriod) => void
  setThirdPartyFilters: (patch: Partial<ThirdPartyReportFilters>) => void
  setThirdPartyHasFiltered: (value: boolean) => void
  addToast: (message: string, type?: ToastMessage['type']) => void
  removeToast: (id: number) => void
}

let toastId = 0

export const useReportsStore = create<ReportsState>()((set) => ({
  activeTab: 'resumen',
  period: 'month',
  thirdPartyFilters: { companyFilter: 'all', orderFilter: 'all', search: '' },
  thirdPartyHasFiltered: false,
  toasts: [],

  setActiveTab: (tab) => set({ activeTab: tab }),
  setPeriod: (period) => set({ period }),
  setThirdPartyFilters: (patch) =>
    set((state) => ({
      thirdPartyFilters: { ...state.thirdPartyFilters, ...patch },
    })),
  setThirdPartyHasFiltered: (value) => set({ thirdPartyHasFiltered: value }),

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
