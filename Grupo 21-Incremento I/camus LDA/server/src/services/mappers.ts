// ============================================================
//  Mappers DB (Prisma) -> DTO que consume el frontend.
//  Mantienen la forma de los tipos de src/types/index.ts para que
//  la Vista no tenga que cambiar su modelo de datos.
// ============================================================
import type { Cliente, OrdenTrabajo, Insumo, CategoriaInsumo } from '@prisma/client'

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

export function toOrderDto(o: OrdenTrabajo & { cliente?: Cliente | null }) {
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
