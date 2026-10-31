import * as XLSX from 'xlsx'
import type { IncidentType, OrderPriority, OrderStatus, WorkOrder } from '@/types'
import { INCIDENT_TYPES } from '@/features/orders/utils/priorityRules'

export const ORDER_IMPORT_HEADERS = [
  'ID Orden',
  'Cliente',
  'Dirección',
  'Servicio',
  'Categoría',
  'Incidente',
  'Estado',
  'Prioridad',
  'Técnico',
  'Fecha límite',
  'Latitud',
  'Longitud',
] as const

export type OrderImportRow = {
  rowNumber: number
  payload: Partial<WorkOrder>
  /** Avisos informativos (no bloquean la importación) */
  notes: string[]
  errors: string[]
}

const DEFAULTS = {
  client: 'Cliente no informado',
  address: 'Dirección no informada',
  category: 'Otros',
  service: 'Servicio no informado',
  status: 'Pendiente' as OrderStatus,
  priority: 'Media' as OrderPriority,
}

const STATUS_SET = new Set<OrderStatus>([
  'Pendiente',
  'En Curso',
  'Completada',
  'Abonado',
  'Cancelada',
])

const PRIORITY_SET = new Set<OrderPriority>(['Baja', 'Media', 'Alta', 'Urgente'])
const INCIDENT_SET = new Set<string>(INCIDENT_TYPES)

function normalizeHeader(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/** Busca valor por coincidencia flexible del nombre de columna. */
function cellByHints(row: Record<string, unknown>, hints: string[]): string {
  const entries = Object.entries(row)
  for (const hint of hints) {
    const nHint = normalizeHeader(hint)
    const exact = entries.find(([k]) => normalizeHeader(k) === nHint)
    if (exact) {
      const v = formatCell(exact[1])
      if (v) return v
    }
  }
  for (const hint of hints) {
    const nHint = normalizeHeader(hint)
    const partial = entries.find(([k]) => {
      const nk = normalizeHeader(k)
      return nk.includes(nHint) || nHint.includes(nk)
    })
    if (partial) {
      const v = formatCell(partial[1])
      if (v) return v
    }
  }
  return ''
}

function formatCell(v: unknown): string {
  if (v == null || v === '') return ''
  if (v instanceof Date && !Number.isNaN(v.getTime())) {
    return v.toISOString().slice(0, 10)
  }
  return String(v).trim()
}

function parseDate(raw: string): string | undefined {
  if (!raw) return undefined
  if (/^\d+(\.\d+)?$/.test(raw)) {
    const serial = Number(raw)
    if (Number.isFinite(serial) && serial > 20000) {
      const utc = Math.round((serial - 25569) * 86400 * 1000)
      return new Date(utc).toISOString().slice(0, 10)
    }
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10)
  const m = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/)
  if (m) {
    const d = m[1]!.padStart(2, '0')
    const mo = m[2]!.padStart(2, '0')
    const y = m[3]!.length === 2 ? `20${m[3]}` : m[3]!
    return `${y}-${mo}-${d}`
  }
  return undefined
}

function parseStatus(raw: string): OrderStatus {
  if (!raw) return DEFAULTS.status
  const match = [...STATUS_SET].find((s) => s.toLowerCase() === raw.toLowerCase())
  return match ?? DEFAULTS.status
}

function parsePriority(raw: string): OrderPriority {
  if (!raw) return DEFAULTS.priority
  return (
    [...PRIORITY_SET].find((p) => p.toLowerCase() === raw.toLowerCase()) ??
    DEFAULTS.priority
  )
}

function parseIncident(raw: string): IncidentType | undefined {
  if (!raw) return undefined
  const hit = [...INCIDENT_SET].find((i) => i.toLowerCase() === raw.toLowerCase())
  return (hit as IncidentType | undefined) ?? undefined
}

function parseNum(raw: string): number | undefined {
  if (!raw) return undefined
  const n = Number(String(raw).replace(',', '.'))
  return Number.isFinite(n) ? n : undefined
}

function rowHasAnyValue(row: Record<string, unknown>): boolean {
  return Object.values(row).some((v) => formatCell(v) !== '')
}

/** Descarga plantilla .xlsx con encabezados y una fila de ejemplo. */
export function downloadOrdersImportTemplate() {
  const example = [
    '',
    'Cliente Ejemplo SpA',
    'Av. Providencia 1234, Santiago',
    'Limpieza de cámara',
    'Mantención',
    'Mantención',
    'Pendiente',
    'Media',
    '',
    new Date().toISOString().slice(0, 10),
    '',
    '',
  ]
  const sheet = XLSX.utils.aoa_to_sheet([[...ORDER_IMPORT_HEADERS], example])
  const book = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(book, sheet, 'Ordenes')
  XLSX.writeFile(book, 'plantilla-importar-ordenes-camus.xlsx')
}

/**
 * Lee Excel/CSV de forma tolerante: usa solo columnas que existan,
 * rellena faltantes con valores por defecto y no bloquea por campos vacíos.
 */
export async function parseOrdersImportFile(file: File): Promise<OrderImportRow[]> {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) return []
  const sheet = workbook.Sheets[sheetName]
  if (!sheet) return []

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: '',
    raw: false,
  })

  const result: OrderImportRow[] = []

  rows.forEach((row, index) => {
    if (!rowHasAnyValue(row)) return

    const notes: string[] = []
    const rawClient = cellByHints(row, [
      'cliente',
      'nombre cliente',
      'razon social',
      'empresa',
      'client',
      'nombre',
    ])
    const rawAddress = cellByHints(row, [
      'direccion',
      'dirección',
      'domicilio',
      'ubicacion',
      'ubicación',
      'address',
      'lugar',
    ])
    const rawService = cellByHints(row, ['servicio', 'service', 'trabajo', 'descripcion', 'descripción'])
    const rawCategory = cellByHints(row, ['categoria', 'categoría', 'category', 'tipo'])
    const rawIncident = cellByHints(row, [
      'incidente',
      'tipo incidente',
      'incident',
      'falla',
    ])
    const rawStatus = cellByHints(row, ['estado', 'status', 'situacion', 'situación'])
    const rawPriority = cellByHints(row, ['prioridad', 'priority', 'urgencia'])
    const rawTech = cellByHints(row, [
      'tecnico',
      'técnico',
      'operador',
      'technician',
      'responsable',
      'asignado',
    ])
    const rawDue = cellByHints(row, [
      'fecha limite',
      'fecha límite',
      'vencimiento',
      'plazo',
      'due date',
      'fecha',
      'fecha programada',
    ])
    const rawId = cellByHints(row, ['id orden', 'id', 'ot', 'codigo', 'código', 'nro', 'numero'])
    const latitude = parseNum(
      cellByHints(row, ['latitud', 'latitude', 'lat']),
    )
    const longitude = parseNum(
      cellByHints(row, ['longitud', 'longitude', 'lng', 'lon', 'long']),
    )

    if (!rawClient) notes.push('Cliente → valor por defecto')
    if (!rawAddress && (latitude == null || longitude == null)) {
      notes.push('Dirección → valor por defecto')
    }
    if (!rawService) notes.push('Servicio → valor por defecto')
    if (!rawStatus) notes.push('Estado → Pendiente')
    if (!rawPriority) notes.push('Prioridad → Media')

    const status = parseStatus(rawStatus)
    const priority = parsePriority(rawPriority)
    const incidentType =
      parseIncident(rawIncident) ?? parseIncident(rawCategory) ?? undefined
    const category = incidentType ?? (rawCategory || DEFAULTS.category)
    const hasCoords = latitude != null && longitude != null
    const address =
      rawAddress.length >= 5
        ? rawAddress
        : hasCoords
          ? 'Ubicación por coordenadas'
          : DEFAULTS.address

    const payload: Partial<WorkOrder> = {
      ...(rawId ? { id: rawId } : {}),
      client: rawClient || DEFAULTS.client,
      address,
      service: rawService || DEFAULTS.service,
      category,
      incidentType,
      status,
      priority,
      priorityManual: Boolean(rawPriority),
      technician: rawTech || undefined,
      dueDate: parseDate(rawDue),
      ...(latitude != null ? { latitude } : {}),
      ...(longitude != null ? { longitude } : {}),
      progress: status === 'Completada' || status === 'Abonado' ? 100 : 0,
      createdAt: new Date().toISOString().slice(0, 10),
    }

    result.push({
      rowNumber: index + 2,
      payload,
      notes,
      errors: [],
    })
  })

  return result
}
