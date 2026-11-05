/** Siglas conocidas por categoría (normalizada sin tildes). */
const CATEGORY_PREFIXES: Record<string, string> = {
  insumos: 'INS',
  valvulas: 'VAL',
  tuberias: 'TUB',
  accesorios: 'ACC',
  sellos: 'SEL',
  equipos: 'EQU',
  mangueras: 'MAN',
  camiones: 'CAM',
  camion: 'CAM',
  vehiculos: 'CAM',
  vehiculo: 'CAM',
  flota: 'CAM',
  bombas: 'BOM',
  bomba: 'BOM',
  herramientas: 'HER',
  herramienta: 'HER',
  energia: 'ENE',
  inspeccion: 'ISP',
}

function normalizeCategoryKey(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

/** Prefijo de 3 letras a partir del nombre de categoría (ej. Insumos → INS). */
export function categoryCodePrefix(categoryName: string): string {
  const key = normalizeCategoryKey(categoryName)
  if (!key) return 'PRD'
  if (CATEGORY_PREFIXES[key]) return CATEGORY_PREFIXES[key]

  const letters = key.replace(/[^a-z0-9]/g, '')
  if (letters.length >= 3) return letters.slice(0, 3).toUpperCase()
  if (letters.length > 0) return letters.toUpperCase().padEnd(3, 'X')
  return 'PRD'
}

/**
 * Siguiente código correlativo por categoría: PREFIX-001, PREFIX-002, ...
 * Solo cuenta códigos con el formato PREFIX-NNN de esa categoría.
 */
export function nextProductCode(
  products: Iterable<{ code: string }>,
  categoryName: string,
): string {
  const prefix = categoryCodePrefix(categoryName)
  const re = new RegExp(`^${prefix}-(\\d+)$`, 'i')
  let max = 0
  for (const product of products) {
    const match = product.code.trim().match(re)
    if (match) max = Math.max(max, parseInt(match[1], 10))
  }
  return `${prefix}-${String(max + 1).padStart(3, '0')}`
}

/** Usa preferred si es válido y libre; si no, asigna correlativo de la categoría. */
export function allocateProductCode(
  products: Iterable<{ code: string }>,
  categoryName: string,
  preferred?: string | null,
): string {
  const list = Array.from(products)
  const trimmed = preferred?.trim().toUpperCase()
  if (trimmed) {
    const taken = list.some((p) => p.code.trim().toUpperCase() === trimmed)
    if (!taken) return trimmed
  }
  let candidate = nextProductCode(list, categoryName)
  const set = new Set(list.map((p) => p.code.trim().toUpperCase()))
  let guard = 0
  while (set.has(candidate.toUpperCase()) && guard < 10_000) {
    const n = parseInt(candidate.split('-').pop() ?? '0', 10) + 1
    candidate = `${categoryCodePrefix(categoryName)}-${String(n).padStart(3, '0')}`
    guard += 1
  }
  return candidate
}
