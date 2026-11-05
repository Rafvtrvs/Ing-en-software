import type { InventoryStatus } from '@/types'
import { isConsumableStockCategory } from '@/features/inventory/utils/stockCategories'

export function computeStockStatus(
  currentStock: number,
  minStock: number,
  category?: string,
): InventoryStatus {
  // Camiones / maquinaria: no reportan stock crítico ni bajo
  if (category && !isConsumableStockCategory(category)) return 'Ok'

  if (currentStock <= 0 || currentStock < minStock * 0.5) return 'Crítico'
  // En el mínimo o por debajo → Bajo (antes solo < dejaba el mínimo como Ok)
  if (currentStock <= minStock) return 'Bajo'
  return 'Ok'
}
