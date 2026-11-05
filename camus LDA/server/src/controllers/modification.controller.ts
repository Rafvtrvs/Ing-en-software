import type { Request, Response, NextFunction } from 'express'
import {
  ModificationError,
  modificationService,
} from '../services/modification.service.js'

function sendError(res: Response, err: unknown, next: NextFunction) {
  if (err instanceof ModificationError) {
    res.status(err.status).json({ error: err.message })
    return
  }
  next(err)
}

export const modificationController = {
  async listRequests(_req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await modificationService.listRequests())
    } catch (err) {
      sendError(res, err, next)
    }
  },

  async createRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const created = await modificationService.createRequest(
        req.params.id,
        {
          fieldsToModify: String(req.body?.fieldsToModify ?? ''),
          reason: String(req.body?.reason ?? ''),
          operatorId: String(req.body?.operatorId ?? req.user?.sub ?? ''),
          operatorName: String(req.body?.operatorName ?? 'Operador'),
        },
        req.user?.sub as number | undefined,
      )
      res.status(201).json(created)
    } catch (err) {
      sendError(res, err, next)
    }
  },

  async approve(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.requestId)
      if (!Number.isFinite(id)) {
        res.status(400).json({ error: 'ID de solicitud inválido' })
        return
      }
      const updated = await modificationService.approve(
        id,
        {
          id: String(req.body?.reviewerId ?? req.user?.sub ?? 'admin'),
          name: String(req.body?.reviewerName ?? 'Administrador'),
        },
        req.user?.sub as number | undefined,
      )
      res.json(updated)
    } catch (err) {
      sendError(res, err, next)
    }
  },

  async reject(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.requestId)
      if (!Number.isFinite(id)) {
        res.status(400).json({ error: 'ID de solicitud inválido' })
        return
      }
      const updated = await modificationService.reject(
        id,
        String(req.body?.reason ?? ''),
        {
          id: String(req.body?.reviewerId ?? req.user?.sub ?? 'admin'),
          name: String(req.body?.reviewerName ?? 'Administrador'),
        },
        req.user?.sub as number | undefined,
      )
      res.json(updated)
    } catch (err) {
      sendError(res, err, next)
    }
  },

  async listHistory(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await modificationService.listHistory(req.params.id))
    } catch (err) {
      sendError(res, err, next)
    }
  },

  async addHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const created = await modificationService.addHistory(
        req.params.id,
        {
          field: String(req.body?.field ?? ''),
          fieldLabel: String(req.body?.fieldLabel ?? req.body?.field ?? ''),
          previousValue: String(req.body?.previousValue ?? ''),
          newValue: String(req.body?.newValue ?? ''),
          changedById: String(req.body?.changedById ?? req.user?.sub ?? 'sistema'),
          changedByName: String(req.body?.changedByName ?? 'Sistema'),
        },
        req.user?.sub as number | undefined,
      )
      res.status(201).json(created)
    } catch (err) {
      sendError(res, err, next)
    }
  },
}
