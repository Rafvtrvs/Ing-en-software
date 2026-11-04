// ============================================================
//  Servicio de Facturación (frontend) -> /api/invoices
// ============================================================
import api from './api'
import type { Invoice, PaymentMethod, PaymentRecord } from '@/types'

export type InvoicePayload = Omit<Invoice, 'id' | 'number'> & { number?: string }

export const billingService = {
  async list(): Promise<Invoice[]> {
    const { data } = await api.get<Invoice[]>('/invoices')
    return data
  },

  async listPayments(limit = 50): Promise<PaymentRecord[]> {
    const { data } = await api.get<PaymentRecord[]>('/invoices/payments', {
      params: { limit },
    })
    return data
  },

  async get(id: string): Promise<Invoice> {
    const { data } = await api.get<Invoice>(`/invoices/${id}`)
    return data
  },

  async create(payload: InvoicePayload): Promise<Invoice> {
    const { data } = await api.post<Invoice>('/invoices', payload)
    return data
  },

  async update(id: string, payload: Partial<InvoicePayload>): Promise<Invoice> {
    const { data } = await api.put<Invoice>(`/invoices/${id}`, payload)
    return data
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/invoices/${id}`)
  },

  async registerPayment(
    id: string,
    payload: {
      amount: number
      method: PaymentMethod
      reference?: string
      notes?: string
    },
  ): Promise<{ invoice: Invoice; payment: PaymentRecord }> {
    const { data } = await api.post<{ invoice: Invoice; payment: PaymentRecord }>(
      `/invoices/${id}/payments`,
      payload,
    )
    return data
  },

  async markAsPaid(
    id: string,
    method: PaymentMethod,
  ): Promise<{ invoice: Invoice; payment: PaymentRecord | null }> {
    const { data } = await api.post<{ invoice: Invoice; payment: PaymentRecord | null }>(
      `/invoices/${id}/mark-paid`,
      { method },
    )
    return data
  },
}
