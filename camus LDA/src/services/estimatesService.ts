// ============================================================
//  Servicio de Costos y Estimaciones (frontend) -> RF16
// ============================================================
import api from './api'
import type { CostEstimate, CostRate, CostRateType, EstimateTotals } from '@/types'

export interface EstimateRequest {
  items: { rateId: number; quantity: number }[]
  taxRate?: number
}

export const estimatesService = {
  async listRates(): Promise<CostRate[]> {
    const { data } = await api.get<CostRate[]>('/costs/rates')
    return data
  },
  async createRate(payload: {
    type: CostRateType
    name: string
    unit: string
    unitPrice: number
  }): Promise<CostRate> {
    const { data } = await api.post<CostRate>('/costs/rates', payload)
    return data
  },
  async removeRate(id: number): Promise<void> {
    await api.delete(`/costs/rates/${id}`)
  },
  /** CU-60: calcular costos (sin guardar) */
  async calculate(payload: EstimateRequest): Promise<EstimateTotals> {
    const { data } = await api.post<EstimateTotals>('/estimates/calculate', payload)
    return data
  },
  /** CU-61: guardar estimación para presentarla al cliente */
  async create(payload: EstimateRequest & { description?: string }): Promise<CostEstimate> {
    const { data } = await api.post<CostEstimate>('/estimates', payload)
    return data
  },
  async list(): Promise<CostEstimate[]> {
    const { data } = await api.get<CostEstimate[]>('/estimates')
    return data
  },
}
