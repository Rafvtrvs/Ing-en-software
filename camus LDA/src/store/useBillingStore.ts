import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { initialInvoices, recentPayments } from '@/data/mock/billing'
import { billingService } from '@/services/billingService'
import type { Invoice, InvoiceStatus, PaymentMethod, PaymentRecord } from '@/types'
import { useOrdersStore } from '@/store/useOrdersStore'
import { isDemoMode, isOfflineApiError } from '@/utils/demoMode'
import axios from 'axios'

export type InvoiceModalMode = 'create' | 'edit' | 'view' | 'delete' | 'payment' | null

export interface ToastMessage {
  id: number
  type: 'success' | 'error' | 'info'
  message: string
}

/** RF-14 — bitácora de cambios de estado financiero */
export interface InvoiceStatusHistoryEntry {
  id: string
  invoiceId: string
  invoiceNumber: string
  previousStatus: InvoiceStatus | '—'
  newStatus: InvoiceStatus
  at: string
  note?: string
}

interface BillingState {
  invoices: Invoice[]
  payments: PaymentRecord[]
  statusHistory: InvoiceStatusHistoryEntry[]
  apiAvailable: boolean
  modalMode: InvoiceModalMode
  selectedInvoice: Invoice | null
  statusFilter: InvoiceStatus | 'all'
  showFilters: boolean
  toasts: ToastMessage[]
  syncFromApi: () => Promise<void>
  addInvoice: (invoice: Omit<Invoice, 'id' | 'number'>) => Promise<{ ok: boolean; message?: string }>
  updateInvoice: (
    id: string,
    data: Partial<Omit<Invoice, 'id'>>,
  ) => Promise<{ ok: boolean; message?: string }>
  deleteInvoice: (id: string) => Promise<{ ok: boolean; message?: string }>
  markAsPaid: (id: string, method: PaymentMethod) => Promise<{ ok: boolean; message?: string }>
  registerPayment: (
    id: string,
    data: { amount: number; method: PaymentMethod; reference?: string; notes?: string },
  ) => Promise<{ ok: boolean; message?: string }>
  getInvoiceStatusHistory: (invoiceId: string) => InvoiceStatusHistoryEntry[]
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

function apiErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { error?: string } | undefined
    if (data?.error) return data.error
  }
  return fallback
}

function pushStatusHistory(
  state: BillingState,
  entry: InvoiceStatusHistoryEntry,
): InvoiceStatusHistoryEntry[] {
  return [entry, ...state.statusHistory].slice(0, 200)
}

function maybeMarkOrderAbonado(invoice: Invoice, fullyPaid: boolean) {
  if (!invoice.orderId || fullyPaid) return
  const order = useOrdersStore.getState().orders.find((o) => o.id === invoice.orderId)
  if (order && order.status !== 'Cancelada') {
    useOrdersStore.getState().updateOrder(order.id, { status: 'Abonado' })
  }
}

export const useBillingStore = create<BillingState>()(
  persist(
    (set, get) => ({
      invoices: initialInvoices,
      payments: recentPayments,
      statusHistory: [],
      apiAvailable: false,
      modalMode: null,
      selectedInvoice: null,
      statusFilter: 'all',
      showFilters: false,
      toasts: [],

      syncFromApi: async () => {
        try {
          const [invoices, payments] = await Promise.all([
            billingService.list(),
            billingService.listPayments(50),
          ])
          set({ invoices, payments, apiAvailable: true })
        } catch {
          set({ apiAvailable: false })
        }
      },

      addInvoice: async (invoice) => {
        if (isDemoMode()) {
          const local: Invoice = {
            ...invoice,
            id: safeId(),
            number: nextInvoiceNumber(),
          }
          set((state) => ({ invoices: [local, ...state.invoices] }))
          return { ok: true }
        }

        try {
          const created = await billingService.create(invoice)
          set((state) => ({
            invoices: [created, ...state.invoices.filter((i) => i.id !== created.id)],
            apiAvailable: true,
          }))
          return { ok: true }
        } catch (err) {
          if (isOfflineApiError(err)) {
            const local: Invoice = {
              ...invoice,
              id: safeId(),
              number: nextInvoiceNumber(),
            }
            set((state) => ({
              invoices: [local, ...state.invoices],
              apiAvailable: false,
            }))
            return { ok: true, message: 'Guardada en modo local (API no disponible)' }
          }
          return { ok: false, message: apiErrorMessage(err, 'No se pudo crear la factura') }
        }
      },

      updateInvoice: async (id, data) => {
        const current = get().invoices.find((inv) => inv.id === id)
        if (!current) return { ok: false, message: 'Factura no encontrada' }

        const previous = { ...current }
        const historyEntry =
          data.status && data.status !== current.status
            ? ({
                id: safeId(),
                invoiceId: id,
                invoiceNumber: current.number,
                previousStatus: current.status,
                newStatus: data.status,
                at: new Date().toISOString(),
                note: 'Cambio manual de estado financiero',
              } as InvoiceStatusHistoryEntry)
            : null

        set((state) => ({
          invoices: state.invoices.map((inv) =>
            inv.id === id ? { ...inv, ...data } : inv,
          ),
          statusHistory: historyEntry
            ? pushStatusHistory(state, historyEntry)
            : state.statusHistory,
          selectedInvoice:
            state.selectedInvoice?.id === id
              ? { ...state.selectedInvoice, ...data }
              : state.selectedInvoice,
        }))

        if (isDemoMode()) return { ok: true }

        try {
          const updated = await billingService.update(id, data)
          set((state) => ({
            invoices: state.invoices.map((inv) => (inv.id === id ? updated : inv)),
            selectedInvoice:
              state.selectedInvoice?.id === id ? updated : state.selectedInvoice,
            apiAvailable: true,
          }))
          if (data.status === 'Pagada' || updated.status === 'Pagada') {
            void get().syncFromApi()
          }
          return { ok: true }
        } catch (err) {
          if (isOfflineApiError(err)) {
            set({ apiAvailable: false })
            return { ok: true, message: 'Actualizada en modo local (API no disponible)' }
          }
          set((state) => ({
            invoices: state.invoices.map((inv) => (inv.id === id ? previous : inv)),
            selectedInvoice:
              state.selectedInvoice?.id === id ? previous : state.selectedInvoice,
          }))
          return { ok: false, message: apiErrorMessage(err, 'No se pudo actualizar la factura') }
        }
      },

      deleteInvoice: async (id) => {
        const previous = get().invoices
        set((state) => ({
          invoices: state.invoices.filter((inv) => inv.id !== id),
        }))

        if (isDemoMode()) return { ok: true }

        try {
          await billingService.remove(id)
          set({ apiAvailable: true })
          return { ok: true }
        } catch (err) {
          if (isOfflineApiError(err)) {
            set({ apiAvailable: false })
            return { ok: true, message: 'Eliminada en modo local (API no disponible)' }
          }
          set({ invoices: previous })
          return { ok: false, message: apiErrorMessage(err, 'No se pudo eliminar la factura') }
        }
      },

      markAsPaid: async (id, method) => {
        const current = get().invoices.find((inv) => inv.id === id)
        if (!current) return { ok: false, message: 'Factura no encontrada' }
        const previous = { ...current }
        const remaining = Math.max(0, current.amount - (current.paidAmount ?? 0))
        const localPayment: PaymentRecord = {
          id: safeId(),
          invoiceNumber: current.number,
          client: current.client,
          amount: remaining > 0 ? remaining : current.amount,
          method,
          date: new Date().toISOString().slice(0, 10),
        }

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
          payments: [localPayment, ...state.payments.filter((p) => p.invoiceNumber !== current.number || p.amount !== localPayment.amount)],
          statusHistory: pushStatusHistory(state, {
            id: safeId(),
            invoiceId: id,
            invoiceNumber: current.number,
            previousStatus: current.status,
            newStatus: 'Pagada',
            at: new Date().toISOString(),
            note: `Marcada como pagada (${method})`,
          }),
        }))

        if (isDemoMode()) return { ok: true }

        try {
          const result = await billingService.markAsPaid(id, method)
          set((state) => ({
            invoices: state.invoices.map((inv) =>
              inv.id === id ? result.invoice : inv,
            ),
            payments: result.payment
              ? [
                  result.payment,
                  ...state.payments.filter((p) => p.id !== localPayment.id),
                ]
              : state.payments,
            selectedInvoice:
              state.selectedInvoice?.id === id ? result.invoice : state.selectedInvoice,
            apiAvailable: true,
          }))
          // Refrescar listado de pagos por si el backend concilió registros
          void get().syncFromApi()
          return { ok: true }
        } catch (err) {
          if (isOfflineApiError(err)) {
            set({ apiAvailable: false })
            return { ok: true }
          }
          set((state) => ({
            invoices: state.invoices.map((inv) => (inv.id === id ? previous : inv)),
            payments: state.payments.filter((p) => p.id !== localPayment.id),
          }))
          return { ok: false, message: apiErrorMessage(err, 'No se pudo marcar como pagada') }
        }
      },

      registerPayment: async (id, data) => {
        const invoice = get().invoices.find((inv) => inv.id === id)
        if (!invoice) return { ok: false, message: 'Factura no encontrada' }

        const paidSoFar = invoice.paidAmount ?? 0
        const newPaid = paidSoFar + data.amount
        const isFullyPaid = newPaid >= invoice.amount
        const nextStatus = isFullyPaid ? ('Pagada' as const) : invoice.status
        const previousInvoice = { ...invoice }
        const previousPayments = get().payments

        const localPayment: PaymentRecord = {
          id: safeId(),
          invoiceNumber: invoice.number,
          client: invoice.client,
          amount: data.amount,
          method: data.method,
          date: new Date().toISOString().slice(0, 10),
        }

        maybeMarkOrderAbonado(invoice, isFullyPaid)

        set((state) => ({
          payments: [localPayment, ...state.payments],
          statusHistory:
            nextStatus !== invoice.status
              ? pushStatusHistory(state, {
                  id: safeId(),
                  invoiceId: id,
                  invoiceNumber: invoice.number,
                  previousStatus: invoice.status,
                  newStatus: nextStatus,
                  at: new Date().toISOString(),
                  note: `Pago registrado: ${data.amount}`,
                })
              : state.statusHistory,
          invoices: state.invoices.map((inv) =>
            inv.id === id
              ? {
                  ...inv,
                  paidAmount: newPaid,
                  paymentMethod: data.method,
                  paidAt: new Date().toISOString().slice(0, 10),
                  status: nextStatus,
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
                  status: nextStatus,
                }
              : state.selectedInvoice,
        }))

        if (isDemoMode()) return { ok: true }

        try {
          const result = await billingService.registerPayment(id, data)
          set((state) => ({
            invoices: state.invoices.map((inv) =>
              inv.id === id ? result.invoice : inv,
            ),
            payments: [
              result.payment,
              ...state.payments.filter((p) => p.id !== localPayment.id),
            ],
            selectedInvoice:
              state.selectedInvoice?.id === id ? result.invoice : state.selectedInvoice,
            apiAvailable: true,
          }))
          return { ok: true }
        } catch (err) {
          if (isOfflineApiError(err)) {
            set({ apiAvailable: false })
            return { ok: true, message: 'Pago guardado en modo local (API no disponible)' }
          }
          set({
            invoices: get().invoices.map((inv) =>
              inv.id === id ? previousInvoice : inv,
            ),
            payments: previousPayments,
            selectedInvoice:
              get().selectedInvoice?.id === id ? previousInvoice : get().selectedInvoice,
          })
          return { ok: false, message: apiErrorMessage(err, 'No se pudo registrar el pago') }
        }
      },

      getInvoiceStatusHistory: (invoiceId) =>
        get().statusHistory.filter((entry) => entry.invoiceId === invoiceId),

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
        statusHistory: state.statusHistory,
      }),
    },
  ),
)
