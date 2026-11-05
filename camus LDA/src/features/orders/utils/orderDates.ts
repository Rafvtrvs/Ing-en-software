/** Utilidades de fechas / duración de OT (CU-152–154) */

/**
 * Parsea yyyy-mm-dd (o ISO con hora) sin desplazar el día por UTC.
 * `new Date('2026-11-05')` es medianoche UTC → en Chile (UTC-3) cae el día 4.
 */
function parseFlexibleDate(value?: string | null): Date | null {
  if (!value?.trim()) return null
  const v = value.trim()

  // Solo día calendario: construir en zona local
  const dayOnly = v.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (dayOnly) {
    const year = Number(dayOnly[1])
    const month = Number(dayOnly[2]) - 1
    const day = Number(dayOnly[3])
    const d = new Date(year, month, day)
    return Number.isNaN(d.getTime()) ? null : d
  }

  // dd/mm/yyyy
  const m = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (m) {
    const day = Number(m[1])
    const month = Number(m[2]) - 1
    const year = Number(m[3])
    const d = new Date(year, month, day)
    return Number.isNaN(d.getTime()) ? null : d
  }

  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? null : d
}

/** Duración en horas entre inicio y término (redondeo 1 decimal) */
export function calcDurationHours(
  startDate?: string | null,
  endDate?: string | null,
): number | undefined {
  const start = parseFlexibleDate(startDate)
  const end = parseFlexibleDate(endDate)
  if (!start || !end) return undefined
  const ms = end.getTime() - start.getTime()
  if (ms < 0) return undefined
  return Math.round((ms / (1000 * 60 * 60)) * 10) / 10
}

/** RF-56 CU-201 — el término no puede ser anterior al inicio */
export function validateServiceTimeSequence(
  startDate?: string | null,
  endDate?: string | null,
): string | null {
  if (!startDate?.trim() || !endDate?.trim()) return null
  const start = parseFlexibleDate(startDate)
  const end = parseFlexibleDate(endDate)
  if (!start || !end) return 'Fechas de servicio inválidas'
  if (end.getTime() < start.getTime()) {
    return 'La fecha de finalización no puede ser anterior al comienzo'
  }
  return null
}

export function toInputDate(value?: string | null): string {
  if (!value?.trim()) return ''
  // Ya viene como día calendario: no reinterpretar por UTC
  const dayOnly = value.trim().match(/^(\d{4}-\d{2}-\d{2})/)
  if (dayOnly) return dayOnly[1]
  const d = parseFlexibleDate(value)
  if (!d) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Fecha de hoy en zona local (AAAA-MM-DD), para defaults de alta de OT. */
export function todayLocalIso(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function formatDisplayDate(value?: string | null): string {
  if (!value?.trim()) return '—'
  const dayOnly = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (dayOnly) {
    const d = new Date(Number(dayOnly[1]), Number(dayOnly[2]) - 1, Number(dayOnly[3]))
    return d.toLocaleDateString('es-CL')
  }
  const d = parseFlexibleDate(value)
  if (!d) return value.trim() || '—'
  return d.toLocaleDateString('es-CL')
}
