import type { OrderStatus } from '@/types'

/** Clampea y redondea un progreso a entero 0–100. */
export function clampProgress(value?: number | null): number {
  if (value == null || !Number.isFinite(value)) return 0
  return Math.min(100, Math.max(0, Math.round(value)))
}

/**
 * Progreso canónico según estado de la OT.
 * Completada → 100; En Curso → al menos 10; resto → valor almacenado.
 */
export function progressForStatus(
  status: OrderStatus,
  current?: number | null,
): number {
  const base = clampProgress(current)
  if (status === 'Completada') return 100
  if (status === 'En Curso') return Math.max(base, 10)
  return base
}

/**
 * Porcentaje a mostrar en barra/label del detalle.
 * Usa el valor declarado (clampeado), sin forzar por estado:
 * al editar el % debe verse reflejado tal cual.
 */
export function displayProgress(progress?: number | null): number {
  return clampProgress(progress)
}
