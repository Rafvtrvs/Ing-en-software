import api from './api'
import type { Equipment, EquipmentStatus } from '@/types'

export interface MachineryCreatePayload {
  code?: string
  name: string
  category?: string
  status?: EquipmentStatus
  serialNumber?: string
  location?: string
  assignedTo?: string | null
  patente?: string
  marca?: string
  purchaseDate?: string
  lastMaintenance?: string
  nextMaintenance?: string
}

export interface MachineryUpdatePayload {
  status?: EquipmentStatus
  lastMaintenance?: string
  nextMaintenance?: string
  assignedTo?: string | null
  location?: string
  name?: string
  category?: string
  patente?: string
  marca?: string
  purchaseDate?: string
  serialNumber?: string
}

export const machineryService = {
  async list(): Promise<Equipment[]> {
    const { data } = await api.get<Equipment[]>('/machinery')
    return data
  },

  async create(payload: MachineryCreatePayload): Promise<Equipment> {
    const { data } = await api.post<Equipment>('/machinery', payload)
    return data
  },

  async update(id: string, payload: MachineryUpdatePayload): Promise<Equipment> {
    const { data } = await api.put<Equipment>(`/machinery/${id}`, payload)
    return data
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/machinery/${id}`)
  },

  async syncAssignments(
    assignments: Array<{ code: string; orderId: string; address: string }>,
  ): Promise<Equipment[]> {
    const { data } = await api.post<Equipment[]>('/machinery/sync-assignments', {
      assignments,
    })
    return data
  },
}
