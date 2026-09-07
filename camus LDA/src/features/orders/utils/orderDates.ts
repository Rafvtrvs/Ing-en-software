/** Utilidades de fechas / duración de OT (CU-152–154) */

function parseFlexibleDate(value?: string | null): Date | null {
  if (!value?.trim()) return null
  const v = value.trim()

  // ISO yyyy-mm-dd
  if (/^\d{4}-\d{2}-\d{2}/.test(v)) {
    const d = new Date(v)
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

export function toInputDate(value?: string | null): string {
  const d = parseFlexibleDate(value)
  if (!d) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function formatDisplayDate(value?: string | null): string {
  const d = parseFlexibleDate(value)
  if (!d) return value?.trim() || '—'
  return d.toLocaleDateString('es-CL')
}
