import type { Request, Response, NextFunction } from 'express'
import { prisma } from '../db/prisma.js'

const ALLOWED_MIME = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])

const MAX_BYTES = 10 * 1024 * 1024

/** RF-40..42 — documentos asociados a OT */
export const documentController = {
  listByOrder: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const idOt = String(req.params.orderId)
      const rows = await prisma.documentoOrden.findMany({
        where: { idOt },
        orderBy: [{ titulo: 'asc' }, { versionActual: 'desc' }],
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
        mimeType = 'application/pdf',
        tamanioBytes = 0,
        urlArchivo,
        subidoPor,
        nota,
      } = req.body ?? {}

      if (!titulo?.trim() || !nombreArchivo?.trim() || !urlArchivo?.trim()) {
        return res.status(400).json({
          message: 'titulo, nombreArchivo y urlArchivo son obligatorios',
        })
      }
      if (!ALLOWED_MIME.has(String(mimeType))) {
        return res.status(400).json({ message: 'Tipo de archivo no permitido' })
      }
      if (Number(tamanioBytes) > MAX_BYTES) {
        return res.status(400).json({ message: 'Archivo supera 10 MB' })
      }

      const order = await prisma.ordenTrabajo.findUnique({ where: { id: idOt } })
      if (!order) return res.status(404).json({ message: 'Orden no encontrada' })

      const created = await prisma.documentoOrden.create({
        data: {
          idOt,
          titulo: String(titulo).trim(),
          tipo: String(tipo),
          versionActual: 1,
          nombreArchivo: String(nombreArchivo).trim(),
          mimeType: String(mimeType),
          tamanioBytes: Number(tamanioBytes) || 0,
          urlArchivo: String(urlArchivo).trim(),
          subidoPor: subidoPor ? String(subidoPor) : null,
          nota: nota ? String(nota) : null,
        },
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
        mimeType = 'application/pdf',
        tamanioBytes = 0,
        urlArchivo,
        subidoPor,
        nota,
      } = req.body ?? {}

      if (!nombreArchivo?.trim() || !urlArchivo?.trim()) {
        return res.status(400).json({
          message: 'nombreArchivo y urlArchivo son obligatorios',
        })
      }
      if (!ALLOWED_MIME.has(String(mimeType))) {
        return res.status(400).json({ message: 'Tipo de archivo no permitido' })
      }
      if (Number(tamanioBytes) > MAX_BYTES) {
        return res.status(400).json({ message: 'Archivo supera 10 MB' })
      }

      const current = await prisma.documentoOrden.findUnique({ where: { id } })
      if (!current) return res.status(404).json({ message: 'Documento no encontrado' })

      const updated = await prisma.documentoOrden.update({
        where: { id },
        data: {
          versionActual: current.versionActual + 1,
          nombreArchivo: String(nombreArchivo).trim(),
          mimeType: String(mimeType),
          tamanioBytes: Number(tamanioBytes) || 0,
          urlArchivo: String(urlArchivo).trim(),
          subidoPor: subidoPor ? String(subidoPor) : current.subidoPor,
          nota: nota ? String(nota) : current.nota,
          fechaCarga: new Date(),
        },
      })
      res.json(updated)
    } catch (err) {
      next(err)
    }
  },
}
