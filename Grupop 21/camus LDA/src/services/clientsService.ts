// ============================================================
//  Servicio de Clientes (frontend) -> consume /api/clients
//  Equivale a la flecha "Solicitudes HTTPS (JSON)" Vista -> Backend.
// ============================================================
import api from './api'
import type { Client } from '@/types'

export type ClientPayload = Omit<Client, 'id'>

export const clientsService = {
  async list(): Promise<Client[]> {
    const { data } = await api.get<Client[]>('/clients')
    return data
  },
  async create(payload: ClientPayload): Promise<Client> {
    const { data } = await api.post<Client>('/clients', payload)
    return data
  },
  async update(id: string, payload: Partial<ClientPayload>): Promise<Client> {
    const { data } = await api.put<Client>(`/clients/${id}`, payload)
    return data
  },
  async remove(id: string): Promise<void> {
    await api.delete(`/clients/${id}`)
  },
}
