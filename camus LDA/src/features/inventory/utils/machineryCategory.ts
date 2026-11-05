/** Categorías de inventario que se registran también como maquinaria (disponibilidad). */
const MACHINERY_CATEGORY_KEYS = new Set([
  'camiones',
  'camion',
  'vehiculos',
  'vehiculo',
  'flota',
  'bombas',
  'bomba',
  'herramientas',
  'herramienta',
  'energia',
  'inspeccion',
  'equipos',
  'equipo',
  'maquinaria',
])

const VEHICLE_CATEGORY_KEYS = new Set([
  'camiones',
  'camion',
  'vehiculos',
  'vehiculo',
  'flota',
])

/** Normaliza el nombre de categoría a la etiqueta usada en disponibilidad. */
const MACHINERY_LABEL_BY_KEY: Record<string, string> = {
  camiones: 'Vehículos',
  camion: 'Vehículos',
  vehiculos: 'Vehículos',
  vehiculo: 'Vehículos',
  flota: 'Vehículos',
  bombas: 'Bombas',
  bomba: 'Bombas',
  herramientas: 'Herramientas',
  herramienta: 'Herramientas',
  energia: 'Energía',
  inspeccion: 'Inspección',
  equipos: 'Equipos',
  equipo: 'Equipos',
  maquinaria: 'Maquinaria',
}

function normalizeCategoryKey(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export function isVehicleCategory(categoryName: string): boolean {
  const key = normalizeCategoryKey(categoryName)
  if (!key) return false
  if (VEHICLE_CATEGORY_KEYS.has(key)) return true
  return key.includes('camion') || key.includes('vehiculo')
}

export function isMachineryCategory(categoryName: string): boolean {
  const key = normalizeCategoryKey(categoryName)
  if (!key) return false
  if (MACHINERY_CATEGORY_KEYS.has(key)) return true
  if (isVehicleCategory(categoryName)) return true
  return (
    key.includes('bomba') ||
    key.includes('herramient') ||
    key.includes('energia') ||
    key.includes('inspeccion') ||
    key.includes('maquin') ||
    key.includes('equipo')
  )
}

/** Categoría que verá el panel de disponibilidad de maquinaria. */
export function toMachineryCategoryLabel(categoryName: string): string {
  const key = normalizeCategoryKey(categoryName)
  if (MACHINERY_LABEL_BY_KEY[key]) return MACHINERY_LABEL_BY_KEY[key]
  if (isVehicleCategory(categoryName)) return 'Vehículos'
  return categoryName.trim() || 'Maquinaria'
}
