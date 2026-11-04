// ============================================================
//  Mappers DB (Prisma) -> DTO que consume el frontend.
//  Mantienen la forma de los tipos de src/types/index.ts para que
//  la Vista no tenga que cambiar su modelo de datos.
// ============================================================
import type {
  Cliente,
  OrdenTrabajo,
  Insumo,
  CategoriaInsumo,
  Factura,
  Pago,
} from '@prisma/client'

function dateOnly(d: Date | null | undefined): string {
  return d ? d.toISOString().slice(0, 10) : ''
}

function money(n: { toNumber?: () => number } | number | null | undefined): number {
  if (n == null) return 0
  if (typeof n === 'number') return n
  if (typeof n.toNumber === 'function') return n.toNumber()
  return Number(n)
}

export function toClientDto(c: Cliente) {
  return {
    id: String(c.id),
    name: c.nombre,
    company: c.empresa,
    rut: c.rut,
    phone: c.telefono,
    email: c.email,
    status: c.estado,
    lastOrder: c.ultimaOrden || '—',
    createdAt: c.creadoEn?.toISOString().slice(0, 10),
  }
}

export function toOrderDto(
  o: OrdenTrabajo & {
    cliente?: Cliente | null
    operador?: { id: number; nombre: string } | null
  },
) {
  return {
    id: o.id,
    client: o.cliente?.nombre ?? '',
    address: o.direccion,
    service: o.servicio,
    category: o.categoria,
    status: o.estado,
    createdAt: o.fechaEmision?.toISOString().slice(0, 10),
    priority: o.prioridad,
    progress: o.progreso,
    sortOrder: o.ordenVisual,
    // Coordenadas (si existen en la BD)
    latitude: (o as any).latitud ?? undefined,
    longitude: (o as any).longitud ?? undefined,
    // Fecha límite (RF28): base para detectar retrasos
    dueDate: (o as any).fechaLimite?.toISOString().slice(0, 10) ?? undefined,
    // Extras mapeables desde Prisma cuando existen (resto vive en store frontend)
    technician: o.operador?.nombre ?? undefined,
    operatorIds: o.operador ? [String(o.operador.id)] : undefined,
    operators: o.operador
      ? [{ id: String(o.operador.id), name: o.operador.nombre }]
      : undefined,
  }
}

export function toAssetDto(i: Insumo & { categoria?: CategoriaInsumo | null }) {
  return {
    id: String(i.id),
    code: i.codigo,
    name: i.nombre,
    category: i.categoria?.nombre ?? '',
    currentStock: i.stockActual,
    minStock: i.stockMinimo,
    unit: i.unidad,
    status: i.estado,
  }
}

export function toInvoiceDto(
  f: Factura & {
    cliente?: Cliente | null
    pagos?: Pago[]
  },
) {
  const paidAmount = (f.pagos ?? []).reduce((sum, p) => sum + money(p.monto), 0)
  return {
    id: String(f.id),
    number: f.numero,
    client: f.cliente?.nombre ?? f.cliente?.empresa ?? '',
    clientRut: f.cliente?.rut ?? '',
    clientId: f.idCliente != null ? String(f.idCliente) : undefined,
    orderId: f.idOt ?? undefined,
    issueDate: dateOnly(f.fechaEmision),
    dueDate: dateOnly(f.fechaVencimiento),
    amount: money(f.monto),
    status: f.estado,
    paymentMethod: f.metodoPago ?? undefined,
    paidAt: f.pagadaEn ? dateOnly(f.pagadaEn) : undefined,
    paidAmount: paidAmount > 0 ? paidAmount : undefined,
    notes: f.notas ?? undefined,
  }
}

export function toPaymentDto(
  p: Pago & {
    factura?: (Factura & { cliente?: Cliente | null }) | null
  },
) {
  return {
    id: String(p.id),
    invoiceNumber: p.factura?.numero ?? '',
    client: p.factura?.cliente?.nombre ?? p.factura?.cliente?.empresa ?? '',
    amount: money(p.monto),
    method: p.metodo ?? 'Transferencia',
    date: dateOnly(p.fecha),
  }
}
