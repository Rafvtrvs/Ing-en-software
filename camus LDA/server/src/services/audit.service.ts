// ============================================================
//  Registro y auditoría (componente "Registro y auditoria")
//  Persiste cada acción relevante en la tabla bitacora_auditoria.
// ============================================================
import { prisma } from '../db/prisma.js'

interface AuditEntry {
  modulo: string
  accion: string
  valorAnterior?: unknown
  valorNuevo?: unknown
  idUsuario?: number | null
}

export interface AuditListFilters {
  limit?: number
  orderId?: string
  userId?: number
  from?: string
  to?: string
}

function parseJsonSafe(raw: string | null): unknown {
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return raw
  }
}

/** Extrae id de OT desde payloads de bitácora (id / orderId / idOt). */
export function extractOrderIdFromAuditPayload(raw: string | null): string | null {
  const parsed = parseJsonSafe(raw)
  if (!parsed || typeof parsed !== 'object') {
    if (typeof parsed === 'string') {
      const m = parsed.match(/\bOT-[A-Za-z0-9_-]+\b/i)
      return m?.[0] ?? null
    }
    return null
  }
  const obj = parsed as Record<string, unknown>
  for (const key of ['orderId', 'idOt', 'id']) {
    const v = obj[key]
    if (typeof v === 'string' && v.trim()) return v.trim()
  }
  return null
}

export const auditService = {
  async log(entry: AuditEntry): Promise<void> {
    try {
      await prisma.bitacoraAuditoria.create({
        data: {
          moduloAfectado: entry.modulo,
          accion: entry.accion,
          valorAnterior: entry.valorAnterior
            ? JSON.stringify(entry.valorAnterior)
            : null,
          valorNuevo: entry.valorNuevo ? JSON.stringify(entry.valorNuevo) : null,
          idUsuario: entry.idUsuario ?? null,
        },
      })
    } catch (err) {
      // La auditoría nunca debe romper la operación principal
      console.error('[audit] no se pudo registrar la acción', err)
    }
  },

  async list(filters: AuditListFilters = {}) {
    const limit = Math.min(Math.max(filters.limit ?? 2000, 1), 5000)
    const where: {
      idUsuario?: number
      fechaHora?: { gte?: Date; lte?: Date }
      OR?: Array<{ valorNuevo?: { contains: string }; valorAnterior?: { contains: string } }>
    } = {}

    if (filters.userId != null && Number.isFinite(filters.userId)) {
      where.idUsuario = filters.userId
    }

    if (filters.from || filters.to) {
      where.fechaHora = {}
      if (filters.from) {
        const start = new Date(`${filters.from}T00:00:00`)
        if (!Number.isNaN(start.getTime())) where.fechaHora.gte = start
      }
      if (filters.to) {
        const end = new Date(`${filters.to}T23:59:59`)
        if (!Number.isNaN(end.getTime())) where.fechaHora.lte = end
      }
    }

    if (filters.orderId?.trim()) {
      const id = filters.orderId.trim()
      where.OR = [
        { valorNuevo: { contains: id } },
        { valorAnterior: { contains: id } },
      ]
    }

    const rows = await prisma.bitacoraAuditoria.findMany({
      where,
      include: { usuario: { select: { id: true, nombre: true, correoElectronico: true } } },
      orderBy: { fechaHora: 'desc' },
      take: limit,
    })

    return rows.map((r) => ({
      id: String(r.id),
      moduloAfectado: r.moduloAfectado,
      accion: r.accion,
      valorAnterior: r.valorAnterior,
      valorNuevo: r.valorNuevo,
      idUsuario: r.idUsuario,
      usuarioNombre: r.usuario?.nombre ?? null,
      usuarioEmail: r.usuario?.correoElectronico ?? null,
      orderId:
        extractOrderIdFromAuditPayload(r.valorNuevo) ??
        extractOrderIdFromAuditPayload(r.valorAnterior),
      fechaHora: r.fechaHora,
    }))
  },
}
