interface ProductLike {
  codigo?: string | null
  code?: string | null
}

export function normalizeProductCode(code: string): string {
  return code.trim().toUpperCase()
}

export class ProductDuplicateError extends Error {
  status = 409
  field: 'code' = 'code'

  constructor(message: string) {
    super(message)
    this.name = 'ProductDuplicateError'
  }
}

export function assertNoDuplicateProductCode(
  existing: ProductLike[],
  code: string,
  excludeId?: number,
) {
  const codeNorm = normalizeProductCode(code)
  if (!codeNorm) return

  for (const row of existing) {
    const rowId = (row as { id?: number }).id
    if (excludeId !== undefined && rowId === excludeId) continue

    const rowCode = normalizeProductCode(row.codigo ?? row.code ?? '')
    if (rowCode && rowCode === codeNorm) {
      throw new ProductDuplicateError(
        'Ya existe un producto registrado con este código.',
      )
    }
  }
}
