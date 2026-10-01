// ============================================================
//  OrderHistoryService — historial de cambios de estado (RF29 / CU-99)
//  Lee de la bitácora los registros 'cambio_estado' (CU-97).
// ============================================================
import { prisma } from '../db/prisma.js'

export interface StatusChangeDto {
  id: string
  orderId: string
  from: string
  to: string
  user: string
  at: string
}

function parse(raw: string | null): { orderId?: string; estado?: string } {
  try {
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export const orderHistoryService = {
  async list(opts: { orderId?: string; limit?: number } = {}): Promise<StatusChangeDto[]> {
    const rows = await prisma.bitacoraAuditoria.findMany({
      where: {
        moduloAfectado: 'ordenes',
        accion: 'cambio_estado',
        ...(opts.orderId
          ? { valorNuevo: { contains: JSON.stringify({ orderId: opts.orderId }).slice(1, -1) } }
          : {}),
      },
      include: { usuario: true },
      orderBy: { fechaHora: 'desc' },
      take: Math.min(Math.max(opts.limit ?? 100, 1), 500),
    })
    return rows.map((r) => {
      const prev = parse(r.valorAnterior)
      const next = parse(r.valorNuevo)
      return {
        id: String(r.id),
        orderId: next.orderId ?? prev.orderId ?? '',
        from: prev.estado ?? '',
        to: next.estado ?? '',
        user: r.usuario?.nombre ?? 'Sistema',
        at: r.fechaHora.toISOString(),
      }
    })
  },
}
