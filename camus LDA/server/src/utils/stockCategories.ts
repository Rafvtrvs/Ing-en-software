const MACHINERY_HINTS = [
  'camion',
  'vehiculo',
  'flota',
  'bomba',
  'herramient',
  'energia',
  'inspeccion',
  'equipo',
  'maquin',
]

const CONSUMABLE_HINTS = [
  'insumo',
  'tuberi',
  'accesori',
  'sello',
  'manguer',
  'valvul',
  'adhesiv',
  'cement',
]

function normalize(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export function isConsumableStockCategory(categoryName: string): boolean {
  const key = normalize(categoryName)
  if (!key) return false
  if (MACHINERY_HINTS.some((h) => key.includes(h))) return false
  if (CONSUMABLE_HINTS.some((h) => key.includes(h))) return true
  // Por defecto, categorías desconocidas sin tipología de flota sí controlan stock
  return !MACHINERY_HINTS.some((h) => key.includes(h))
}
