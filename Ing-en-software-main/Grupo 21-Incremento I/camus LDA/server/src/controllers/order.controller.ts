// OrderController -> delega en OrderService
import type { Request, Response, NextFunction } from 'express'
import { orderService } from '../services/order.service.js'

export const orderController = {
  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await orderService.list())
    } catch (err) {
      next(err)
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const created = await orderService.create(req.body, req.user?.sub)
      res.status(201).json(created)
    } catch (err) {
      next(err)
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await orderService.update(
        req.params.id,
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
      await orderService.remove(req.params.id, req.user?.sub)
      res.status(204).end()
    } catch (err) {
      next(err)
    }
  },
}
