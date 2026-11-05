import type { Request, Response, NextFunction } from 'express'
import { rescheduleService } from '../services/reschedule.service.js'

export const rescheduleController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await rescheduleService.listByOrder(String(req.params.id)))
    } catch (err) {
      next(err)
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const created = await rescheduleService.create(
        String(req.params.id),
        {
          previousDate: String(req.body?.previousDate ?? ''),
          newDate: String(req.body?.newDate ?? ''),
          changedById: String(req.body?.changedById ?? req.user?.sub ?? 'sistema'),
          changedByName: String(req.body?.changedByName ?? 'Sistema'),
        },
        req.user?.sub,
      )
      res.status(201).json(created)
    } catch (err) {
      next(err)
    }
  },
}
