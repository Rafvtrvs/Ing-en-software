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

  async list(limit = 100) {
    return prisma.bitacoraAuditoria.findMany({
      orderBy: { fechaHora: 'desc' },
      take: limit,
    })
  },
}
