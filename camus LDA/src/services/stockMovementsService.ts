import api from './api'
import type { Product, StockMovement, StockMovementType } from '@/types'

export interface StockMovementCreatePayload {
  productId: string
  type: StockMovementType
  quantity: number
  detail?: string
  orderId?: string
  user?: string
}

export interface StockMovementCreateResult {
  movement: StockMovement
  product: Product
}

export const stockMovementsService = {
  async list(): Promise<StockMovement[]> {
    const { data } = await api.get<StockMovement[]>('/stock-movements')
    return data
  },

  async create(payload: StockMovementCreatePayload): Promise<StockMovementCreateResult> {
    const { data } = await api.post<StockMovementCreateResult>('/stock-movements', payload)
    return data
  },
}
