// ============================================================
//  Servicio de Órdenes (frontend) -> consume /api/orders
// ============================================================
import api from './api'
import type {
  DelayAction,
  DelayLevel,
  DelaysResponse,
  DelayedOrder,
  OrderEvidence,
  OrderIntervention,
  StatusChange,
  WorkOrder,
} from '@/types'

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
  /** RF28 / CU-93–94: órdenes retrasadas, clasificadas y priorizadas */
  async listDelays(level?: DelayLevel): Promise<DelaysResponse> {
    const { data } = await api.get<DelaysResponse>('/orders/delays', {
      params: level ? { level } : undefined,
    })
    return data
  },
  /** RF28 / CU-95: notificar retrasos de nivel Alto */
  async notifyDelays(): Promise<DelayedOrder[]> {
    const { data } = await api.post<{ notified: DelayedOrder[] }>('/orders/delays/notify')
    return data.notified
  },
  /** RF28 / CU-96: reprogramar, priorizar o intervenir una orden retrasada */
  async manageDelay(
    orderId: string,
    action: DelayAction,
    newDueDate?: string,
  ): Promise<WorkOrder> {
    const { data } = await api.post<WorkOrder>(`/orders/${orderId}/delay-action`, {
      action,
      newDueDate,
    })
    return data
  },
  /** RF29 / CU-99: historial de cambios de estado (de una OT o global) */
  async listStatusHistory(orderId?: string): Promise<StatusChange[]> {
    const { data } = await api.get<StatusChange[]>('/orders/history', {
      params: orderId ? { orderId } : undefined,
    })
    return data
  },
  /** RF09 / CU-31: listar evidencia visual de una OT */
  async listEvidence(orderId: string): Promise<OrderEvidence[]> {
    const { data } = await api.get<OrderEvidence[]>(`/orders/${orderId}/evidence`)
    return data
  },
  /** RF09 / CU-30: subir imagen de evidencia (base64 en JSON) */
  async uploadEvidence(orderId: string, file: File): Promise<OrderEvidence> {
    const data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(file)
    })
    return this.uploadEvidenceData(orderId, {
      fileName: file.name,
      mimeType: file.type,
      data,
    })
  },
  /** Variante que recibe la imagen ya serializada (cola offline RF35) */
  async uploadEvidenceData(
    orderId: string,
    payload: { fileName: string; mimeType: string; data: string },
  ): Promise<OrderEvidence> {
    const res = await api.post<OrderEvidence>(`/orders/${orderId}/evidence`, payload)
    return res.data
  },
  /** RF09 / CU-31 y CU-33: obtiene el archivo original como Blob (requiere token) */
  async fetchEvidenceFile(orderId: string, evidenceId: number): Promise<Blob> {
    const { data } = await api.get<Blob>(
      `/orders/${orderId}/evidence/${evidenceId}/file`,
      { responseType: 'blob' },
    )
    return data
  },
  /** RF09 / CU-32: eliminar evidencia */
  async removeEvidence(orderId: string, evidenceId: number): Promise<void> {
    await api.delete(`/orders/${orderId}/evidence/${evidenceId}`)
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
