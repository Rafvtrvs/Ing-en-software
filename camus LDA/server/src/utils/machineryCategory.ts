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

export function isMachineryCategory(categoryName: string): boolean {
  const key = normalizeCategoryKey(categoryName)
  if (!key) return false
  if (MACHINERY_CATEGORY_KEYS.has(key)) return true
  return (
    key.includes('camion') ||
    key.includes('vehiculo') ||
    key.includes('bomba') ||
    key.includes('herramient') ||
    key.includes('energia') ||
    key.includes('inspeccion') ||
    key.includes('maquin') ||
    key.includes('equipo')
  )
}

export function toMachineryCategoryLabel(categoryName: string): string {
  const key = normalizeCategoryKey(categoryName)
  if (MACHINERY_LABEL_BY_KEY[key]) return MACHINERY_LABEL_BY_KEY[key]
  if (key.includes('camion') || key.includes('vehiculo')) return 'Vehículos'
  return categoryName.trim() || 'Maquinaria'
}
