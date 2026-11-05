import type { Request, Response, NextFunction } from 'express'
import { kitService } from '../services/kit.service.js'

export const kitController = {
  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await kitService.list())
    } catch (err) {
      next(err)
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const created = await kitService.create(req.body, req.user?.sub)
      res.status(201).json(created)
    } catch (err) {
      next(err)
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await kitService.update(
        Number(req.params.id),
        req.body,
        req.user?.sub,
      )
      res.json(updated)
    } catch (err) {
      next(err)
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await kitService.remove(Number(req.params.id), req.user?.sub)
      res.status(204).end()
    } catch (err) {
      next(err)
    }
  },
}
