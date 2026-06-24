import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { initialInvoices, recentPayments } from '@/data/mock/billing'
import type { Invoice, InvoiceStatus, PaymentMethod, PaymentRecord } from '@/types'
import { useOrdersStore } from '@/store/useOrdersStore'

export type InvoiceModalMode = 'create' | 'edit' | 'view' | 'delete' | 'payment' | null

export interface ToastMessage {
  id: number
  type: 'success' | 'error' | 'info'
  message: string
}

interface BillingState {
  invoices: Invoice[]
  payments: PaymentRecord[]
  modalMode: InvoiceModalMode
  selectedInvoice: Invoice | null
  statusFilter: InvoiceStatus | 'all'
  showFilters: boolean
  toasts: ToastMessage[]
  addInvoice: (invoice: Omit<Invoice, 'id' | 'number'>) => void
  updateInvoice: (id: string, data: Partial<Omit<Invoice, 'id'>>) => void
  deleteInvoice: (id: string) => void
  markAsPaid: (id: string, method: PaymentMethod) => void
  registerPayment: (
    id: string,
    data: { amount: number; method: PaymentMethod; reference?: string; notes?: string },
  ) => void
  openCreateModal: () => void
  openEditModal: (invoice: Invoice) => void
  openViewModal: (invoice: Invoice) => void
  openDeleteModal: (invoice: Invoice) => void
  openPaymentModal: (invoice: Invoice) => void
  closeModal: () => void
  setStatusFilter: (status: InvoiceStatus | 'all') => void
  toggleFilters: () => void
  addToast: (message: string, type?: ToastMessage['type']) => void
  removeToast: (id: number) => void
}

let toastId = 0
let invoiceSeq = initialInvoices.length

function safeId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function nextInvoiceNumber() {
  invoiceSeq += 1
  return `F-2026-${String(invoiceSeq).padStart(4, '0')}`
}

export const useBillingStore = create<BillingState>()(
  persist(
    (set) => ({
      invoices: initialInvoices,
      payments: recentPayments,
      modalMode: null,
      selectedInvoice: null,
      statusFilter: 'all',
      showFilters: false,
      toasts: [],

      addInvoice: (invoice) =>
        set((state) => ({
          invoices: [
            {
              ...invoice,
              id: safeId(),
              number: nextInvoiceNumber(),
            },
            ...state.invoices,
          ],
        })),

      updateInvoice: (id, data) =>
        set((state) => ({
          invoices: state.invoices.map((inv) =>
            inv.id === id ? { ...inv, ...data } : inv,
          ),
          selectedInvoice:
            state.selectedInvoice?.id === id
              ? { ...state.selectedInvoice, ...data }
              : state.selectedInvoice,
        })),

      deleteInvoice: (id) =>
        set((state) => ({
          invoices: state.invoices.filter((inv) => inv.id !== id),
        })),

      markAsPaid: (id, method) =>
        set((state) => ({
          invoices: state.invoices.map((inv) =>
            inv.id === id
              ? {
                  ...inv,
                  status: 'Pagada' as const,
                  paymentMethod: method,
                  paidAmount: inv.amount,
                  paidAt: new Date().toISOString().slice(0, 10),
                }
              : inv,
          ),
        })),

      registerPayment: (id, data) =>
        set((state) => {
          const invoice = state.invoices.find((inv) => inv.id === id)
          if (!invoice) return state

          const paidSoFar = invoice.paidAmount ?? 0
          const newPaid = paidSoFar + data.amount
          const isFullyPaid = newPaid >= invoice.amount

          // Si la factura está asociada a una OT y se registra un abono parcial,
          // el estado de la OT pasa a "Abonado" (mientras no esté cancelada).
          if (invoice.orderId && newPaid > 0 && !isFullyPaid) {
            const order = useOrdersStore.getState().orders.find((o) => o.id === invoice.orderId)
            if (order && order.status !== 'Cancelada') {
              useOrdersStore.getState().updateOrder(order.id, { status: 'Abonado' })
            }
          }

          const payment: PaymentRecord = {
            id: safeId(),
            invoiceNumber: invoice.number,
            client: invoice.client,
            amount: data.amount,
            method: data.method,
            date: new Date().toISOString().slice(0, 10),
          }

          return {
            payments: [payment, ...state.payments],
            invoices: state.invoices.map((inv) =>
              inv.id === id
                ? {
                    ...inv,
                    paidAmount: newPaid,
                    paymentMethod: data.method,
                    paidAt: new Date().toISOString().slice(0, 10),
                    status: isFullyPaid ? ('Pagada' as const) : inv.status,
                    notes: data.notes || inv.notes,
                  }
                : inv,
            ),
            selectedInvoice:
              state.selectedInvoice?.id === id
                ? {
                    ...state.selectedInvoice,
                    paidAmount: newPaid,
                    paymentMethod: data.method,
                    paidAt: new Date().toISOString().slice(0, 10),
                    status: isFullyPaid ? ('Pagada' as const) : state.selectedInvoice.status,
                  }
                : state.selectedInvoice,
          }
        }),

      openCreateModal: () => set({ modalMode: 'create', selectedInvoice: null }),
      openEditModal: (invoice) => set({ modalMode: 'edit', selectedInvoice: invoice }),
      openViewModal: (invoice) => set({ modalMode: 'view', selectedInvoice: invoice }),
      openDeleteModal: (invoice) =>
        set({ modalMode: 'delete', selectedInvoice: invoice }),
      openPaymentModal: (invoice) =>
        set({ modalMode: 'payment', selectedInvoice: invoice }),
      closeModal: () => set({ modalMode: null, selectedInvoice: null }),

      setStatusFilter: (status) => set({ statusFilter: status }),
      toggleFilters: () => set((state) => ({ showFilters: !state.showFilters })),

      addToast: (message, type = 'success') => {
        const id = ++toastId
        set((state) => ({ toasts: [...state.toasts, { id, message, type }] }))
        setTimeout(() => {
          useBillingStore.getState().removeToast(id)
        }, 3500)
      },

      removeToast: (id) =>
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
    }),
    {
      name: 'camus_billing_store_v1',
      partialize: (state) => ({
        invoices: state.invoices,
        payments: state.payments,
      }),
    },
  ),
)
