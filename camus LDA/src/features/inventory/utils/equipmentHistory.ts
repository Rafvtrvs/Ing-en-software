import type { AuditLogEntry } from '@/data/mock/audit'

export type EquipmentHistoryItem = {
  id: string
  equipmentCode: string
  equipmentName: string
  date: string
  actionLabel: string
  changes: string[]
  user: string
}

const FIELD_LABELS: Record<string, string> = {
  codigo: 'Código',
  nombre: 'Nombre',
  estado: 'Estado',
  numeroSerie: 'Número de serie',
  ubicacion: 'Ubicación',
  ubicacionBase: 'Ubicación base',
  categoria: 'Categoría',
  patente: 'Patente',
  marca: 'Marca',
  fechaCompra: 'Fecha de compra',
  ultimaMantencion: 'Última mantención',
  proximaMantencion: 'Próxima mantención',
  asignadoA: 'Asignado a',
}

const TRACKED_FIELDS = Object.keys(FIELD_LABELS)

function safeJsonParse(raw: string | null): Record<string, unknown> | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as unknown
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null
  } catch {
    return null
  }
}

function normalizeValue(value: unknown): string {
  if (value == null || value === '') return '—'
  if (typeof value === 'string') {
    // ISO date → solo día
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
      return value.slice(0, 10)
    }
    return value.trim() || '—'
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  if (value instanceof Object && 'toISOString' in value) {
    try {
      return String((value as { toISOString: () => string }).toISOString().slice(0, 10))
    } catch {
      return String(value)
    }
  }
  return String(value)
}

function valuesEqual(a: unknown, b: unknown): boolean {
  return normalizeValue(a) === normalizeValue(b)
}

function diffMachineryFields(
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null,
): string[] {
  if (!before && after) {
    return TRACKED_FIELDS.filter((key) => {
      const v = normalizeValue(after[key])
      return v !== '—'
    }).map((key) => `${FIELD_LABELS[key]}: ${normalizeValue(after[key])}`)
  }

  if (before && !after) {
    return ['Equipo eliminado del registro']
  }

  if (!before || !after) return []

  const changes: string[] = []
  for (const key of TRACKED_FIELDS) {
    if (!(key in before) && !(key in after)) continue
    if (valuesEqual(before[key], after[key])) continue
    const label = FIELD_LABELS[key]
    changes.push(
      `${label}: ${normalizeValue(before[key])} → ${normalizeValue(after[key])}`,
    )
  }
  return changes
}

function actionLabel(accion: string): string {
  const a = accion.toLowerCase()
  if (a.includes('crear')) return 'Alta de equipo'
  if (a.includes('eliminar')) return 'Eliminación'
  if (a.includes('actualizar')) return 'Modificación'
  return accion
}

function isNoiseMachineryAction(accion: string): boolean {
  const a = accion.toLowerCase()
  return (
    a.includes('sincronizar-ubicaciones-maquinaria') ||
    a.includes('sincronizar ubicaciones') ||
    (a.includes('sincronizar') && a.includes('maquinaria'))
  )
}

export function mapAuditToEquipmentHistory(logs: AuditLogEntry[]): EquipmentHistoryItem[] {
  return logs
    .filter((log) => {
      const modulo = log.moduloAfectado.toLowerCase()
      const accion = log.accion.toLowerCase()
      if (isNoiseMachineryAction(accion)) return false
      return (
        modulo.includes('inventario') &&
        (accion.includes('maquinaria') || accion.includes('equipo'))
      )
    })
    .map((log) => {
      const before = safeJsonParse(log.valorAnterior)
      const after = safeJsonParse(log.valorNuevo)
      const code = String(after?.codigo ?? before?.codigo ?? '—')
      const name = String(after?.nombre ?? before?.nombre ?? 'Equipo')
      const changes = diffMachineryFields(before, after)

      return {
        id: log.id,
        equipmentCode: code,
        equipmentName: name,
        date: log.fechaHora,
        actionLabel: actionLabel(log.accion),
        changes:
          changes.length > 0
            ? changes
            : [`Acción registrada: ${log.accion}`],
        user: log.usuario,
      }
    })
    .filter((item) => item.changes.length > 0)
    .slice(0, 40)
}
