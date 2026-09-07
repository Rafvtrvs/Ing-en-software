// ============================================================
//  Servicio de Órdenes (frontend) -> consume /api/orders
// ============================================================
import api from './api'
import type { WorkOrder } from '@/types'

export const ordersService = {
  async list(): Promise<WorkOrder[]> {
    const { data } = await api.get<WorkOrder[]>('/orders')
    return data
  },
  async create(payload: Partial<WorkOrder>): Promise<WorkOrder> {
    const { data } = await api.post<WorkOrder>('/orders', payload)
    return data
  },
  async update(id: string, payload: Partial<WorkOrder>): Promise<WorkOrder> {
    const { data } = await api.put<WorkOrder>(`/orders/${id}`, payload)
    return data
  },
  async remove(id: string): Promise<void> {
    await api.delete(`/orders/${id}`)
  },
}
