/** Dataset sintético determinista para carga de rendimiento en PostgreSQL. */

export type LoadPreset = 'medio' | 'alto' | 'estres'

export interface LoadDatasetOptions {
  seed?: number
  clients?: number
  orders?: number
  invoiceRatio?: number
}

export interface GeneratedClient {
  rut: string
  nombre: string
  empresa: string
  telefono: string
  email: string
  direccion: string
  estado: string
  ultimaOrden: string
}

export interface GeneratedOrder {
  id: string
  estado: string
  prioridad: string
  servicio: string
  categoria: string
  direccion: string
  latitud: number
  longitud: number
  fechaEmision: Date
  fechaLimite: Date | null
  progreso: number
  ordenVisual: number
  clientRut: string
}

export interface GeneratedInvoice {
  numero: string
  orderId: string
  clientRut: string
  fechaEmision: Date
  fechaVencimiento: Date
  monto: number
  estado: string
  metodoPago: string | null
  pagadaEn: Date | null
}

export interface LoadDataset {
  seed: number
  clients: GeneratedClient[]
  orders: GeneratedOrder[]
  invoices: GeneratedInvoice[]
}

export const LOAD_PRESETS: Record<LoadPreset, LoadDatasetOptions> = {
  medio: { seed: 42, clients: 120, orders: 800, invoiceRatio: 0.6 },
  alto: { seed: 42, clients: 250, orders: 2500, invoiceRatio: 0.65 },
  estres: { seed: 7, clients: 500, orders: 8000, invoiceRatio: 0.7 },
}

function createSeededRng(seed: number) {
  let t = seed >>> 0
  return () => {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

function pick<T>(rng: () => number, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)]!
}

function intBetween(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min
}

function pad(n: number, size: number) {
  return String(n).padStart(size, '0')
}

function formatIsoDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1, 2)}-${pad(d.getDate(), 2)}`
}

function dayOffset(base: Date, days: number): Date {
  const d = new Date(base)
  d.setDate(d.getDate() + days)
  return d
}

/** Fecha aleatoria repartida de forma uniforme entre los últimos `monthsBack` meses. */
function randomDateInLastMonths(
  rng: () => number,
  monthsBack = 12,
  end: Date = new Date(),
): Date {
  const monthOffset = intBetween(rng, 0, Math.max(0, monthsBack - 1))
  const anchor = new Date(end.getFullYear(), end.getMonth() - monthOffset, 1)
  const daysInMonth = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0).getDate()
  const day = intBetween(rng, 1, daysInMonth)
  const d = new Date(anchor.getFullYear(), anchor.getMonth(), day)
  return d.getTime() > end.getTime() ? new Date(end) : d
}

/** RUT chileno formateado en máximo 12 chars (XX.XXX.XXX-X). */
function fakeRut(rng: () => number): string {
  const body = intBetween(rng, 10_000_000, 25_000_000)
  const s = String(body)
  const dv = intBetween(rng, 0, 9)
  return `${s.slice(0, 2)}.${s.slice(2, 5)}.${s.slice(5)}-${dv}`
}

const FIRST_NAMES = [
  'Carlos', 'María', 'Luis', 'Ana', 'Pedro', 'Camila', 'Diego', 'Valentina',
  'Jorge', 'Francisca', 'Andrés', 'Paula', 'Rodrigo', 'Constanza', 'Felipe',
  'Daniela', 'Ignacio', 'Catalina', 'Sebastián', 'Fernanda',
] as const

const LAST_NAMES = [
  'Mendoza', 'Rojas', 'Torres', 'Vargas', 'Soto', 'Muñoz', 'Castro', 'Silva',
  'Núñez', 'Pérez', 'González', 'Ramírez', 'Herrera', 'Morales', 'Fuentes',
  'Lagos', 'Reyes', 'Espinoza', 'Navarro', 'Pizarro',
] as const

const COMPANIES = [
  'Constructora', 'Inversiones', 'Comercial', 'Servicios', 'Aguas',
  'Mantenciones', 'Obras', 'Sanitaria', 'Urban', 'Industrial',
] as const

const SUFFIXES = ['Ltda.', 'SpA', 'S.A.', 'EIRL'] as const

const COMMUNES = [
  'Maipú', 'Puente Alto', 'La Florida', 'Santiago', 'Ñuñoa', 'Providencia',
  'Las Condes', 'San Bernardo', 'Quilicura', 'Pudahuel', 'La Reina', 'Macul',
] as const

const STREETS = [
  'Av. Libertador', 'Calle Los Aromos', 'Pasaje El Roble', 'Av. Las Torres',
  'Camino El Alba', 'Av. Vicuña Mackenna', 'Calle San Martín', 'Av. Grecia',
  'Calle Prat', 'Av. Independencia',
] as const

const CATEGORIES = [
  { category: 'Obstrucción', service: 'Destape de cámara' },
  { category: 'Fuga', service: 'Reparación de fuga' },
  { category: 'Rotura de Tubería', service: 'Cambio de tramo' },
  { category: 'Rebalse', service: 'Control de rebalse' },
  { category: 'Mantención', service: 'Mantención preventiva' },
  { category: 'Colapso', service: 'Reparación de colapso' },
  { category: 'Otros', service: 'Inspección técnica' },
] as const

const STATUSES = [
  'Pendiente',
  'Pendiente',
  'En Curso',
  'En Curso',
  'Completada',
  'Completada',
  'Completada',
  'Abonado',
  'Cancelada',
] as const

const PRIORITIES = ['Baja', 'Media', 'Media', 'Alta', 'Urgente'] as const

const CLIENT_STATUSES = ['Activo', 'Activo', 'Activo', 'Inactivo', 'Pendiente'] as const

const INVOICE_STATUSES = [
  'Emitida',
  'Emitida',
  'Pagada',
  'Pagada',
  'Pagada',
  'Vencida',
  'Borrador',
] as const

export function generateLoadDataset(options: LoadDatasetOptions = {}): LoadDataset {
  const seed = options.seed ?? 42
  const clientCount = options.clients ?? 200
  const orderCount = options.orders ?? 2000
  const invoiceRatio = options.invoiceRatio ?? 0.65
  const rng = createSeededRng(seed)
  const now = new Date()

  const clients: GeneratedClient[] = Array.from({ length: clientCount }, (_, i) => {
    const first = pick(rng, FIRST_NAMES)
    const last = pick(rng, LAST_NAMES)
    const isCompany = rng() > 0.45
    const nombre = isCompany
      ? `${pick(rng, COMPANIES)} ${last} ${pick(rng, SUFFIXES)}`
      : `${first} ${last}`
    const empresa = isCompany
      ? nombre
      : `${pick(rng, COMPANIES)} ${last} ${pick(rng, SUFFIXES)}`
    const created = randomDateInLastMonths(rng, 14, now)
    const lastOrder = dayOffset(created, intBetween(rng, 0, 45))
    const commune = pick(rng, COMMUNES)
    return {
      rut: fakeRut(rng),
      nombre,
      empresa,
      telefono: `+56 9 ${intBetween(rng, 1000, 9999)} ${intBetween(rng, 1000, 9999)}`,
      email: `${first.toLowerCase()}.${last.toLowerCase()}${i}@ejemplo.cl`,
      direccion: `${pick(rng, STREETS)} ${intBetween(rng, 100, 9999)}, ${commune}`,
      estado: pick(rng, CLIENT_STATUSES),
      ultimaOrden: formatIsoDate(lastOrder.getTime() > now.getTime() ? now : lastOrder),
    }
  })

  const orders: GeneratedOrder[] = Array.from({ length: orderCount }, (_, i) => {
    const client = pick(rng, clients)
    const cat = pick(rng, CATEGORIES)
    const status = pick(rng, STATUSES)
    const created = randomDateInLastMonths(rng, 12, now)
    const due = dayOffset(created, intBetween(rng, 3, 21))
    const progreso =
      status === 'Completada' || status === 'Abonado'
        ? 100
        : status === 'En Curso'
          ? intBetween(rng, 15, 90)
          : 0

    return {
      id: `OT-LOAD-${pad(i + 1, 5)}`,
      estado: status,
      prioridad: pick(rng, PRIORITIES),
      servicio: cat.service,
      categoria: cat.category,
      direccion: `${pick(rng, STREETS)} ${intBetween(rng, 100, 9999)}, ${pick(rng, COMMUNES)}`,
      latitud: -33.45 + (rng() - 0.5) * 0.4,
      longitud: -70.66 + (rng() - 0.5) * 0.4,
      fechaEmision: created,
      fechaLimite: due,
      progreso,
      ordenVisual: i,
      clientRut: client.rut,
    }
  })

  const billable = orders.filter(
    (o) => o.estado === 'Completada' || o.estado === 'Abonado' || o.estado === 'En Curso',
  )
  const invoiceTarget = Math.min(billable.length, Math.round(orderCount * invoiceRatio))
  const invoices: GeneratedInvoice[] = []

  for (let i = 0; i < invoiceTarget; i++) {
    const order = billable[i]!
    const status = pick(rng, INVOICE_STATUSES)
    const issue = dayOffset(order.fechaEmision, intBetween(rng, 0, 10))
    const due = dayOffset(issue, 30)
    const monto = intBetween(rng, 80_000, 4_500_000)
    invoices.push({
      numero: `F-LOAD-${pad(i + 1, 5)}`,
      orderId: order.id,
      clientRut: order.clientRut,
      fechaEmision: issue,
      fechaVencimiento: due,
      monto,
      estado: status,
      metodoPago: status === 'Pagada' ? 'Transferencia' : null,
      pagadaEn:
        status === 'Pagada' ? dayOffset(issue, intBetween(rng, 1, 20)) : null,
    })
  }

  return { seed, clients, orders, invoices }
}

export function resolvePreset(raw?: string): LoadPreset {
  if (raw === 'medio' || raw === 'alto' || raw === 'estres') return raw
  return 'alto'
}
