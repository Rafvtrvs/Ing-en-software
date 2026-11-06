import type { Request, Response, NextFunction } from 'express'
import { prisma } from '../db/prisma.js'
import { storageService } from '../external/storage.service.js'
import { auditService } from '../services/audit.service.js'

const PDF_MIME = 'application/pdf'
const MAX_BYTES = 10 * 1024 * 1024

function decodeBase64File(raw?: string): Buffer | null {
  if (!raw?.trim()) return null
  const cleaned = String(raw).replace(/^data:[^;]+;base64,/, '')
  if (!cleaned) return null
  const buffer = Buffer.from(cleaned, 'base64')
  return buffer.length > 0 ? buffer : null
}

async function resolveStoredFile(input: {
  data?: string
  urlArchivo?: string
  nombreArchivo?: string
  mimeType?: string
  tamanioBytes?: number
  orderId: string
}): Promise<{
  urlArchivo: string
  nombreArchivo: string
  mimeType: string
  tamanioBytes: number
  contenido?: Buffer
} | { error: string; status: number }> {
  const mime = String(input.mimeType || PDF_MIME).toLowerCase()
  if (mime !== PDF_MIME) {
    return { error: 'Solo se permiten archivos PDF', status: 400 }
  }

  const buffer = decodeBase64File(input.data)
  if (buffer) {
    if (buffer.length > MAX_BYTES) {
      return { error: 'El PDF supera el máximo de 10 MB', status: 413 }
    }
    // Firma PDF: %PDF
    if (buffer.length < 4 || buffer.subarray(0, 4).toString('utf8') !== '%PDF') {
      return { error: 'El archivo no es un PDF válido', status: 400 }
    }
    const baseName =
      (input.nombreArchivo ?? '').trim().replace(/[^\w.\-()+ ]+/g, '_') ||
      'documento.pdf'
    const safeName = baseName.toLowerCase().endsWith('.pdf')
      ? baseName
      : `${baseName}.pdf`
    return {
      urlArchivo: 'db://documento',
      nombreArchivo: safeName.slice(0, 255),
      mimeType: PDF_MIME,
      tamanioBytes: buffer.length,
      contenido: buffer,
    }
  }

  const urlArchivo = String(input.urlArchivo ?? '').trim()
  if (!urlArchivo) {
    return { error: 'Debe subir un archivo PDF', status: 400 }
  }
  const tamanioBytes = Number(input.tamanioBytes) || 0
  if (tamanioBytes > MAX_BYTES) {
    return { error: 'El PDF supera el máximo de 10 MB', status: 413 }
  }
  const nombreArchivo =
    (input.nombreArchivo ?? '').trim() || 'documento.pdf'
  return {
    urlArchivo: urlArchivo.slice(0, 500),
    nombreArchivo: nombreArchivo.slice(0, 255),
    mimeType: PDF_MIME,
    tamanioBytes,
  }
}

/** RF-40..42 — documentos asociados a OT (PDF) */
export const documentController = {
  listByOrder: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const idOt = String(req.params.orderId)
      const rows = await prisma.documentoOrden.findMany({
        where: { idOt },
        orderBy: [{ fechaCarga: 'desc' }, { titulo: 'asc' }],
        select: {
          id: true,
          titulo: true,
          tipo: true,
          versionActual: true,
          nombreArchivo: true,
          mimeType: true,
          tamanioBytes: true,
          urlArchivo: true,
          subidoPor: true,
          nota: true,
          fechaCarga: true,
          idOt: true,
        },
      })
      res.json(rows)
    } catch (err) {
      next(err)
    }
  },

  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const idOt = String(req.params.orderId)
      const {
        titulo,
        tipo = 'general',
        nombreArchivo,
        mimeType = PDF_MIME,
        tamanioBytes = 0,
        urlArchivo,
        data,
        subidoPor,
        nota,
      } = req.body ?? {}

      if (!titulo?.trim()) {
        return res.status(400).json({ message: 'El título es obligatorio' })
      }

      const order = await prisma.ordenTrabajo.findUnique({ where: { id: idOt } })
      if (!order) return res.status(404).json({ message: 'Orden no encontrada' })

      const stored = await resolveStoredFile({
        data,
        urlArchivo,
        nombreArchivo,
        mimeType,
        tamanioBytes,
        orderId: idOt,
      })
      if ('error' in stored) {
        return res.status(stored.status).json({ message: stored.error })
      }

      const created = await prisma.documentoOrden.create({
        data: {
          idOt,
          titulo: String(titulo).trim(),
          tipo: String(tipo),
          versionActual: 1,
          nombreArchivo: stored.nombreArchivo,
          mimeType: stored.mimeType,
          tamanioBytes: stored.tamanioBytes,
          urlArchivo: stored.urlArchivo,
          contenido: stored.contenido,
          subidoPor: subidoPor ? String(subidoPor) : null,
          nota: nota ? String(nota) : null,
        },
      })
      await auditService.log({
        modulo: 'documentos',
        accion: 'cargar',
        valorNuevo: {
          orderId: idOt,
          documentId: created.id,
          titulo: created.titulo,
          version: created.versionActual,
        },
        idUsuario: req.user?.sub,
      })
      res.status(201).json(created)
    } catch (err) {
      next(err)
    }
  },

  addVersion: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Number(req.params.documentId)
      const {
        nombreArchivo,
        mimeType = PDF_MIME,
        tamanioBytes = 0,
        urlArchivo,
        data,
        subidoPor,
        nota,
      } = req.body ?? {}

      const current = await prisma.documentoOrden.findUnique({ where: { id } })
      if (!current) return res.status(404).json({ message: 'Documento no encontrado' })

      const stored = await resolveStoredFile({
        data,
        urlArchivo,
        nombreArchivo,
        mimeType,
        tamanioBytes,
        orderId: current.idOt ?? 'ot',
      })
      if ('error' in stored) {
        return res.status(stored.status).json({ message: stored.error })
      }

      const updated = await prisma.documentoOrden.update({
        where: { id },
        data: {
          versionActual: current.versionActual + 1,
          nombreArchivo: stored.nombreArchivo,
          mimeType: stored.mimeType,
          tamanioBytes: stored.tamanioBytes,
          urlArchivo: stored.urlArchivo,
          contenido: stored.contenido ?? null,
          subidoPor: subidoPor ? String(subidoPor) : current.subidoPor,
          nota: nota ? String(nota) : current.nota,
          fechaCarga: new Date(),
        },
      })
      await auditService.log({
        modulo: 'documentos',
        accion: 'nueva_version',
        valorAnterior: {
          orderId: current.idOt,
          documentId: current.id,
          version: current.versionActual,
        },
        valorNuevo: {
          orderId: updated.idOt,
          documentId: updated.id,
          titulo: updated.titulo,
          version: updated.versionActual,
        },
        idUsuario: req.user?.sub,
      })
      res.json(updated)
    } catch (err) {
      next(err)
    }
  },

  file: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orderId = String(req.params.orderId)
      const id = Number(req.params.documentId)
      const row = await prisma.documentoOrden.findUnique({ where: { id } })
      if (!row || row.idOt !== orderId) {
        return res.status(404).json({ message: 'Documento no encontrado' })
      }
      const buffer =
        row.contenido && row.contenido.length > 0
          ? Buffer.from(row.contenido)
          : await storageService.read(row.urlArchivo)
      res.setHeader('Content-Type', row.mimeType || PDF_MIME)
      res.setHeader(
        'Content-Disposition',
        `inline; filename="${encodeURIComponent(row.nombreArchivo || 'documento.pdf')}"`,
      )
      res.send(buffer)
    } catch (err) {
      next(err)
    }
  },
}
