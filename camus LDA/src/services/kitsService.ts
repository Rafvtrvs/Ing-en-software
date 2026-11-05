import api from './api'
import type { ProductKit } from '@/types'

export interface KitPayload {
  name: string
  description?: string
  status?: ProductKit['status']
  items: Array<{
    productId: string
    quantity: number
  }>
}

export const kitsService = {
  async list(): Promise<ProductKit[]> {
    const { data } = await api.get<ProductKit[]>('/kits')
    return data
  },

  async create(payload: KitPayload): Promise<ProductKit> {
    const { data } = await api.post<ProductKit>('/kits', payload)
    return data
  },

  async update(id: string, payload: Partial<KitPayload>): Promise<ProductKit> {
    const { data } = await api.put<ProductKit>(`/kits/${id}`, payload)
    return data
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/kits/${id}`)
  },
}
