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
  OrderComment,
  OrderIntervention,
  OrderModificationHistoryEntry,
  OrderModificationRequest,
  OrderRescheduleEvent,
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
  /** RF65 — listar comentarios de OT (bitácora Postgres) */
  async listComments(orderId: string): Promise<OrderComment[]> {
    const { data } = await api.get<OrderComment[]>(`/orders/${orderId}/comments`)
    return data
  },
  /** RF65 — registrar comentario (persiste en bitácora) */
  async createComment(
    orderId: string,
    content: string,
    authorName?: string,
  ): Promise<OrderComment> {
    const { data } = await api.post<OrderComment>(`/orders/${orderId}/comments`, {
      content,
      authorName,
    })
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

  /** RF-40: subir documento PDF a la OT */
  async uploadOrderDocument(
    orderId: string,
    payload: {
      title: string
      kind: string
      file: File
      uploadedBy?: string
      note?: string
    },
  ): Promise<{
    id: number
    titulo: string
    tipo: string
    versionActual: number
    nombreArchivo: string
    mimeType: string
    tamanioBytes: number
    urlArchivo: string
    subidoPor: string | null
    fechaCarga: string
  }> {
    const data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(payload.file)
    })
    const res = await api.post(`/orders/${orderId}/documents`, {
      titulo: payload.title,
      tipo: payload.kind,
      nombreArchivo: payload.file.name,
      mimeType: payload.file.type || 'application/pdf',
      tamanioBytes: payload.file.size,
      data,
      subidoPor: payload.uploadedBy,
      nota: payload.note,
    })
    return res.data
  },

  /** RF-42: nueva versión PDF de un documento */
  async uploadDocumentVersion(
    documentId: string,
    payload: { file: File; uploadedBy?: string; note?: string },
  ): Promise<{
    id: number
    versionActual: number
    nombreArchivo: string
    mimeType: string
    tamanioBytes: number
    urlArchivo: string
    fechaCarga: string
  }> {
    const data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(payload.file)
    })
    const res = await api.post(`/documents/${documentId}/versions`, {
      nombreArchivo: payload.file.name,
      mimeType: payload.file.type || 'application/pdf',
      tamanioBytes: payload.file.size,
      data,
      subidoPor: payload.uploadedBy,
      nota: payload.note,
    })
    return res.data
  },

  /** Descarga/visualiza el PDF almacenado */
  async fetchOrderDocumentFile(orderId: string, documentId: string): Promise<Blob> {
    const { data } = await api.get<Blob>(
      `/orders/${orderId}/documents/${documentId}/file`,
      { responseType: 'blob' },
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

  /** RF68 — listar solicitudes de modificación */
  async listModificationRequests(): Promise<OrderModificationRequest[]> {
    const { data } = await api.get<OrderModificationRequest[]>(
      '/modification-requests',
    )
    return data
  },

  /** RF68 CDS 233 — crear solicitud */
  async createModificationRequest(
    orderId: string,
    payload: {
      fieldsToModify: string
      reason: string
      operatorId: string
      operatorName: string
    },
  ): Promise<OrderModificationRequest> {
    const { data } = await api.post<OrderModificationRequest>(
      `/orders/${orderId}/modification-requests`,
      payload,
    )
    return data
  },

  async approveModificationRequest(
    requestId: string,
    reviewer: { reviewerId: string; reviewerName: string },
  ): Promise<OrderModificationRequest> {
    const { data } = await api.post<OrderModificationRequest>(
      `/modification-requests/${requestId}/approve`,
      reviewer,
    )
    return data
  },

  async rejectModificationRequest(
    requestId: string,
    payload: { reason: string; reviewerId: string; reviewerName: string },
  ): Promise<OrderModificationRequest> {
    const { data } = await api.post<OrderModificationRequest>(
      `/modification-requests/${requestId}/reject`,
      payload,
    )
    return data
  },

  async listModificationHistory(
    orderId: string,
  ): Promise<OrderModificationHistoryEntry[]> {
    const { data } = await api.get<OrderModificationHistoryEntry[]>(
      `/orders/${orderId}/modification-history`,
    )
    return data
  },

  async addModificationHistory(
    orderId: string,
    entry: Omit<OrderModificationHistoryEntry, 'id' | 'orderId' | 'changedAt'>,
  ): Promise<OrderModificationHistoryEntry> {
    const { data } = await api.post<OrderModificationHistoryEntry>(
      `/orders/${orderId}/modification-history`,
      entry,
    )
    return data
  },

  /** RF66 CDS 229 — listar reprogramaciones */
  async listReschedules(orderId: string): Promise<OrderRescheduleEvent[]> {
    const { data } = await api.get<OrderRescheduleEvent[]>(
      `/orders/${orderId}/reschedules`,
    )
    return data
  },

  /** RF66 — crear reprogramación (persiste historial + actualiza fechaLimite) */
  async createReschedule(
    orderId: string,
    payload: {
      previousDate: string
      newDate: string
      changedById: string
      changedByName: string
    },
  ): Promise<OrderRescheduleEvent> {
    const { data } = await api.post<OrderRescheduleEvent>(
      `/orders/${orderId}/reschedules`,
      payload,
    )
    return data
  },
}
