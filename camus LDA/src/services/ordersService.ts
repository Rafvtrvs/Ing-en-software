// ============================================================
//  Servicio de Órdenes (frontend) -> consume /api/orders
// ============================================================
import api from './api'
import type { OrderIntervention, WorkOrder } from '@/types'

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
  /** CU-149: registrar intervención en una OT */
  async createIntervention(
    orderId: string,
    detail: string,
  ): Promise<OrderIntervention> {
    const { data } = await api.post<OrderIntervention>(
      `/orders/${orderId}/interventions`,
      { detail },
    )
    return data
  },
  /** CU-150: listar historial de intervenciones */
  async listInterventions(orderId: string): Promise<OrderIntervention[]> {
    const { data } = await api.get<OrderIntervention[]>(
      `/orders/${orderId}/interventions`,
    )
    return data
  },
  /** CU-151: editar intervención */
  async updateIntervention(
    orderId: string,
    interventionId: number,
    detail: string,
  ): Promise<OrderIntervention> {
    const { data } = await api.put<OrderIntervention>(
      `/orders/${orderId}/interventions/${interventionId}`,
      { detail },
    )
    return data
  },
}
