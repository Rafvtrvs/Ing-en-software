import type { InventoryStatus } from '@/types'

export function computeStockStatus(
  currentStock: number,
  minStock: number,
): InventoryStatus {
  if (currentStock <= 0 || currentStock < minStock * 0.5) return 'Crítico'
  if (currentStock < minStock) return 'Bajo'
  return 'Ok'
}
