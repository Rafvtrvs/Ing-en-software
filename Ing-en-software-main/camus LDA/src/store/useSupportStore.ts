import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { faqItems, initialSupportTickets } from '@/data/mock/settings'
import type { SupportTab, SupportTicket, SupportTicketPriority } from '@/types'

export interface ToastMessage {
  id: number
  type: 'success' | 'error' | 'info'
  message: string
}

interface ContactForm {
  subject: string
  category: string
  message: string
  priority: SupportTicketPriority
}

interface SupportState {
  tickets: SupportTicket[]
  faqs: typeof faqItems
  activeTab: SupportTab
  searchFaq: string
  toasts: ToastMessage[]
  setActiveTab: (tab: SupportTab) => void
  setSearchFaq: (q: string) => void
  submitContact: (form: ContactForm) => void
  addToast: (message: string, type?: ToastMessage['type']) => void
  removeToast: (id: number) => void
}

let toastId = 0

function nextTicketId(tickets: SupportTicket[]) {
  const num = tickets.length + 38
  return `TK-2026-${String(num).padStart(4, '0')}`
}

export const useSupportStore = create<SupportState>()(
  persist(
    (set, get) => ({
      tickets: initialSupportTickets,
      faqs: faqItems,
      activeTab: 'ayuda',
      searchFaq: '',
      toasts: [],

      setActiveTab: (tab) => set({ activeTab: tab }),
      setSearchFaq: (q) => set({ searchFaq: q }),

      submitContact: (form) => {
        const today = new Date().toISOString().slice(0, 10)
        const ticket: SupportTicket = {
          id: nextTicketId(get().tickets),
          subject: form.subject,
          description: `[${form.category}] ${form.message}`,
          status: 'Abierto',
          priority: form.priority,
          createdAt: today,
          updatedAt: today,
        }
        set((state) => ({ tickets: [ticket, ...state.tickets] }))
        get().addToast(`Ticket ${ticket.id} creado. Te contactaremos pronto.`)
      },

      addToast: (message, type = 'success') => {
        const id = ++toastId
        set((state) => ({ toasts: [...state.toasts, { id, message, type }] }))
        setTimeout(() => {
          useSupportStore.getState().removeToast(id)
        }, 3500)
      },

      removeToast: (id) =>
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
    }),
    {
      name: 'camus_support_store_v1',
      partialize: (state) => ({ tickets: state.tickets }),
    },
  ),
)
