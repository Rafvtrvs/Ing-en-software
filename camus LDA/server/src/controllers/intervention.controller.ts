// InterventionController -> InterventionService (CU-149–151)
import type { Request, Response, NextFunction } from 'express'
import { interventionService } from '../services/intervention.service.js'

export const interventionController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const orderId = req.params.id
      const items = await interventionService.listByOrder(orderId)
      res.json(items)
    } catch (err) {
      next(err)
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const orderId = req.params.id
      const detail = String(req.body?.detail ?? req.body?.detalle ?? '')
      const created = await interventionService.create(
        orderId,
        detail,
        req.user?.sub,
      )
      res.status(201).json(created)
    } catch (err) {
      next(err)
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const orderId = req.params.id
      const interventionId = Number(req.params.interventionId)
      if (!Number.isFinite(interventionId)) {
        res.status(400).json({ message: 'ID de intervención inválido' })
        return
      }
      const detail = String(req.body?.detail ?? req.body?.detalle ?? '')
      const updated = await interventionService.update(
        orderId,
        interventionId,
        detail,
        req.user?.sub,
      )
      res.json(updated)
    } catch (err) {
      next(err)
    }
  },
}
