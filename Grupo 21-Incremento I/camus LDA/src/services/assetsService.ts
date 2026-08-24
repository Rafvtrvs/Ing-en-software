// ============================================================
//  Servicio de Activos/Inventario (frontend) -> consume /api/assets
// ============================================================
import api from './api'
import type { Product } from '@/types'

export const assetsService = {
  async list(): Promise<Product[]> {
    const { data } = await api.get<Product[]>('/assets')
    return data
  },
  async create(payload: Partial<Product>): Promise<Product> {
    const { data } = await api.post<Product>('/assets', payload)
    return data
  },
  async update(id: string, payload: Partial<Product>): Promise<Product> {
    const { data } = await api.put<Product>(`/assets/${id}`, payload)
    return data
  },
  async remove(id: string): Promise<void> {
    await api.delete(`/assets/${id}`)
  },
}
