// ============================================================
//  Comentarios de OT — persistidos en bitácora (Postgres)
// ============================================================
import { prisma } from '../db/prisma.js'
import { auditService, extractOrderIdFromAuditPayload } from './audit.service.js'

export class CommentError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'CommentError'
    this.status = status
  }
}

export interface CommentDto {
  id: string
  orderId: string
  content: string
  authorId: string
  authorName: string
  createdAt: string
}

export const commentService = {
  async listByOrder(orderId: string): Promise<CommentDto[]> {
    const order = await prisma.ordenTrabajo.findUnique({ where: { id: orderId } })
    if (!order) throw new CommentError(404, 'Orden de trabajo no encontrada')

    const rows = await prisma.bitacoraAuditoria.findMany({
      where: {
        moduloAfectado: 'ordenes',
        accion: 'comentario',
        valorNuevo: { contains: orderId },
      },
      include: { usuario: { select: { id: true, nombre: true } } },
      orderBy: { fechaHora: 'desc' },
      take: 500,
    })

    return rows
      .map((r) => {
        let content = ''
        let authorName = r.usuario?.nombre ?? 'Usuario'
        try {
          const parsed = r.valorNuevo ? JSON.parse(r.valorNuevo) : null
          if (parsed && typeof parsed === 'object') {
            const oid = extractOrderIdFromAuditPayload(r.valorNuevo)
            if (oid && oid !== orderId) return null
            content = String((parsed as { content?: string }).content ?? '')
            if ((parsed as { authorName?: string }).authorName) {
              authorName = String((parsed as { authorName?: string }).authorName)
            }
          }
        } catch {
          content = r.valorNuevo ?? ''
        }
        if (!content.trim()) return null
        return {
          id: String(r.id),
          orderId,
          content,
          authorId: r.idUsuario != null ? String(r.idUsuario) : '',
          authorName,
          createdAt: r.fechaHora.toISOString(),
        } satisfies CommentDto
      })
      .filter((c): c is CommentDto => c != null)
  },

  async create(
    orderId: string,
    content: string,
    userId?: number,
    authorName?: string,
  ): Promise<CommentDto> {
    const trimmed = content?.trim() ?? ''
    if (!trimmed) throw new CommentError(400, 'El comentario no puede estar vacío')
    if (trimmed.length > 2000) {
      throw new CommentError(400, 'El comentario no puede superar 2000 caracteres')
    }

    const order = await prisma.ordenTrabajo.findUnique({ where: { id: orderId } })
    if (!order) throw new CommentError(404, 'Orden de trabajo no encontrada')

    let resolvedName = authorName?.trim() || ''
    if (!resolvedName && userId != null) {
      const user = await prisma.usuario.findUnique({ where: { id: userId } })
      resolvedName = user?.nombre ?? 'Usuario'
    }
    if (!resolvedName) resolvedName = 'Usuario'

    await auditService.log({
      modulo: 'ordenes',
      accion: 'comentario',
      valorNuevo: {
        orderId,
        content: trimmed,
        authorName: resolvedName,
      },
      idUsuario: userId,
    })

    const latest = await prisma.bitacoraAuditoria.findFirst({
      where: {
        moduloAfectado: 'ordenes',
        accion: 'comentario',
        idUsuario: userId ?? undefined,
        valorNuevo: { contains: orderId },
      },
      orderBy: { fechaHora: 'desc' },
    })

    return {
      id: latest ? String(latest.id) : `cmt-${Date.now()}`,
      orderId,
      content: trimmed,
      authorId: userId != null ? String(userId) : '',
      authorName: resolvedName,
      createdAt: (latest?.fechaHora ?? new Date()).toISOString(),
    }
  },
}
