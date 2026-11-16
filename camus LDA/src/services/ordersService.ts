
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
  async listInterventions(orderId: string): Promise<OrderIntervention[]> {
    const { data } = await api.get<OrderIntervention[]>(
      `/orders/${orderId}/interventions`,
    )
    return data
  },
  async listComments(orderId: string): Promise<OrderComment[]> {
    const { data } = await api.get<OrderComment[]>(`/orders/${orderId}/comments`)
    return data
  },
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
  async listDelays(level?: DelayLevel): Promise<DelaysResponse> {
    const { data } = await api.get<DelaysResponse>('/orders/delays', {
      params: level ? { level } : undefined,
    })
    return data
  },
  async notifyDelays(): Promise<DelayedOrder[]> {
    const { data } = await api.post<{ notified: DelayedOrder[] }>('/orders/delays/notify')
    return data.notified
  },
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
  async listStatusHistory(orderId?: string): Promise<StatusChange[]> {
    const { data } = await api.get<StatusChange[]>('/orders/history', {
      params: orderId ? { orderId } : undefined,
    })
    return data
  },
  async listEvidence(orderId: string): Promise<OrderEvidence[]> {
    const { data } = await api.get<OrderEvidence[]>(`/orders/${orderId}/evidence`)
    return data
  },
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
  async uploadEvidenceData(
    orderId: string,
    payload: { fileName: string; mimeType: string; data: string },
  ): Promise<OrderEvidence> {
    const res = await api.post<OrderEvidence>(`/orders/${orderId}/evidence`, payload)
    return res.data
  },
  async fetchEvidenceFile(orderId: string, evidenceId: number): Promise<Blob> {
    const { data } = await api.get<Blob>(
      `/orders/${orderId}/evidence/${evidenceId}/file`,
      { responseType: 'blob' },
    )
    return data
  },
  async linkEvidenceUrl(orderId: string, url: string): Promise<OrderEvidence> {
    const { data } = await api.post<OrderEvidence>(`/orders/${orderId}/evidence`, { url })
    return data
  },

  async removeEvidence(orderId: string, evidenceId: number): Promise<void> {
    await api.delete(`/orders/${orderId}/evidence/${evidenceId}`)
  },

  async listOrderDocuments(orderId: string): Promise<
    {
      id: number
      titulo: string
      tipo: string
      versionActual: number
      nombreArchivo: string
      mimeType: string
      tamanioBytes: number
      urlArchivo: string
      subidoPor: string | null
      nota: string | null
      fechaCarga: string
    }[]
  > {
    const { data } = await api.get(`/orders/${orderId}/documents`)
    return data
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
      changes?: {
        patch?: Record<string, unknown>
        diff?: Array<{ field: string; label: string; from: string; to: string }>
      }
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
