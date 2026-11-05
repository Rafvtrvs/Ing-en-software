import type { Request, Response, NextFunction } from 'express'
import { machineryService } from '../services/machinery.service.js'

export const machineryController = {
  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await machineryService.list())
    } catch (err) {
      next(err)
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const created = await machineryService.create(req.body, req.user?.sub)
      res.status(201).json(created)
    } catch (err) {
      next(err)
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await machineryService.update(
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
      res.json(await machineryService.remove(Number(req.params.id), req.user?.sub))
    } catch (err) {
      next(err)
    }
  },

  async syncAssignments(req: Request, res: Response, next: NextFunction) {
    try {
      const assignments = Array.isArray(req.body?.assignments)
        ? req.body.assignments
        : []
      res.json(await machineryService.syncAssignments(assignments, req.user?.sub))
    } catch (err) {
      next(err)
    }
  },
}
