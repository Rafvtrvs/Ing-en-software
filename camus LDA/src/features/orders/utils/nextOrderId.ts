/** Prefijo estándar: OT-2026-0001 */
export function orderIdPrefix(year = new Date().getFullYear()): string {
  return `OT-${year}-`
}

/** Siguiente correlativo OT-AAAA-NNNN según IDs existentes del año. */
export function nextOrderId(
  existingIds: Iterable<string>,
  year = new Date().getFullYear(),
): string {
  const prefix = orderIdPrefix(year)
  let max = 0
  for (const id of existingIds) {
    if (!id.startsWith(prefix)) continue
    const n = parseInt(id.slice(prefix.length), 10)
    if (!Number.isNaN(n)) max = Math.max(max, n)
  }
  return `${prefix}${String(max + 1).padStart(4, '0')}`
}

/**
 * Usa `preferred` solo si viene y no choca (p. ej. import Excel).
 * Si no, asigna el siguiente correlativo libre.
 */
export function allocateOrderId(
  existingIds: Iterable<string>,
  preferred?: string | null,
): string {
  const ids = Array.from(existingIds)
  const set = new Set(ids)
  const trimmed = preferred?.trim()
  const year = new Date().getFullYear()
  const standard = new RegExp(`^OT-${year}-\\d{4,}$`)
  // Solo respeta IDs correlativos estándar; ignora OT-T-* u otros temporales
  if (trimmed && standard.test(trimmed) && !set.has(trimmed)) return trimmed
  let candidate = nextOrderId(ids)
  let guard = 0
  while (set.has(candidate) && guard < 10_000) {
    const prefix = candidate.replace(/\d+$/, '')
    const n = parseInt(candidate.slice(prefix.length), 10) + 1
    candidate = `${prefix}${String(n).padStart(4, '0')}`
    guard += 1
  }
  return candidate
}
