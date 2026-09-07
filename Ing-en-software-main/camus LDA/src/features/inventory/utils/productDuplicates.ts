import type { Product } from '@/types'

export function normalizeProductCode(code: string): string {
  return code.trim().toUpperCase()
}

export function findDuplicateProductCode(
  products: Product[],
  code: string,
  excludeId?: string,
): { field: 'code'; message: string } | null {
  const codeNorm = normalizeProductCode(code)
  if (!codeNorm) return null

  for (const product of products) {
    if (excludeId && product.id === excludeId) continue
    if (normalizeProductCode(product.code) === codeNorm) {
      return {
        field: 'code',
        message: 'Ya existe un producto registrado con este código.',
      }
    }
  }

  return null
}
