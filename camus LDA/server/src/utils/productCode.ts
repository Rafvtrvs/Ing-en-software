const CATEGORY_PREFIXES: Record<string, string> = {
  insumos: 'INS',
  valvulas: 'VAL',
  tuberias: 'TUB',
  accesorios: 'ACC',
  sellos: 'SEL',
  equipos: 'EQU',
  mangueras: 'MAN',
  camiones: 'CAM',
}

function normalizeCategoryKey(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export function categoryCodePrefix(categoryName: string): string {
  const key = normalizeCategoryKey(categoryName)
  if (!key) return 'PRD'
  if (CATEGORY_PREFIXES[key]) return CATEGORY_PREFIXES[key]
  const letters = key.replace(/[^a-z0-9]/g, '')
  if (letters.length >= 3) return letters.slice(0, 3).toUpperCase()
  if (letters.length > 0) return letters.toUpperCase().padEnd(3, 'X')
  return 'PRD'
}

export function nextProductCode(
  products: Iterable<{ codigo?: string | null; code?: string | null }>,
  categoryName: string,
): string {
  const prefix = categoryCodePrefix(categoryName)
  const re = new RegExp(`^${prefix}-(\\d+)$`, 'i')
  let max = 0
  for (const product of products) {
    const code = (product.codigo ?? product.code ?? '').trim()
    const match = code.match(re)
    if (match) max = Math.max(max, parseInt(match[1], 10))
  }
  return `${prefix}-${String(max + 1).padStart(3, '0')}`
}
