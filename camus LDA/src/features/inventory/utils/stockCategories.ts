import { isMachineryCategory } from '@/features/inventory/utils/machineryCategory'

/**
 * Categorías de inventario consumible (stock bajo/crítico aplica).
 * Camiones, vehículos y maquinaria no entran en alertas de stock.
 * Categorías desconocidas (no flota) sí controlan stock — alineado con el API.
 */
const CONSUMABLE_KEYS = new Set([
  'insumos',
  'insumo',
  'tuberias',
  'tuberia',
  'accesorios',
  'accesorio',
  'sellos',
  'sello',
  'mangueras',
  'manguera',
  'valvulas',
  'valvula',
  'adhesivos',
  'cemento',
])

function normalizeCategoryKey(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

/** True si la categoría participa de control de stock crítico/bajo. */
export function isConsumableStockCategory(categoryName: string): boolean {
  const key = normalizeCategoryKey(categoryName)
  if (!key) return true
  if (isMachineryCategory(categoryName)) return false
  if (CONSUMABLE_KEYS.has(key)) return true
  if (
    key.includes('insumo') ||
    key.includes('tuberi') ||
    key.includes('accesori') ||
    key.includes('sello') ||
    key.includes('manguer') ||
    key.includes('valvul') ||
    key.includes('adhesiv') ||
    key.includes('cement')
  ) {
    return true
  }
  // Desconocidas (no maquinaria): sí controlan stock, igual que el backend
  return true
}
