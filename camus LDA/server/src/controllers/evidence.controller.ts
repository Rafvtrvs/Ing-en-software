// EvidenceController -> EvidenceService (RF09 / CU-30 a CU-34)
import type { NextFunction, Request, Response } from 'express'
import { evidenceService } from '../services/evidence.service.js'

function evidenceId(req: Request) {
  const id = Number(req.params.evidenceId)
  if (!Number.isInteger(id)) {
    throw Object.assign(new Error('Identificador de evidencia inválido'), { status: 400 })
  }
  return id
}

export const evidenceController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await evidenceService.list(req.params.id))
    } catch (err) {
      next(err)
    }
  },

  async upload(req: Request, res: Response, next: NextFunction) {
    try {
      const created = await evidenceService.upload(req.params.id, req.body ?? {}, req.user?.sub)
      res.status(201).json(created)
    } catch (err) {
      next(err)
    }
  },

  async file(req: Request, res: Response, next: NextFunction) {
    try {
      const { content, mimeType, fileName } = await evidenceService.getFile(
        req.params.id,
        evidenceId(req),
      )
      res.setHeader('Content-Type', mimeType)
      if (req.query.download === '1') {
        res.setHeader(
          'Content-Disposition',
          "attachment; filename*=UTF-8''" + encodeURIComponent(fileName),
        )
      }
      res.send(content)
    } catch (err) {
      next(err)
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await evidenceService.remove(req.params.id, evidenceId(req), req.user?.sub)
      res.status(204).end()
    } catch (err) {
      next(err)
    }
  },
}
