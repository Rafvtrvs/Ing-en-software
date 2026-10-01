// DelayController / HistoryController (RF28 CU-93–96 · RF29 CU-99)
import type { NextFunction, Request, Response } from 'express'
import { delayService } from '../services/delay.service.js'
import { orderHistoryService } from '../services/orderHistory.service.js'

export const delayController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const level = typeof req.query.level === 'string' ? req.query.level : undefined
      res.json(await delayService.list(level))
    } catch (err) {
      next(err)
    }
  },

  async notify(req: Request, res: Response, next: NextFunction) {
    try {
      res.json({ notified: await delayService.notifyHighDelays(req.user?.sub) })
    } catch (err) {
      next(err)
    }
  },

  async manage(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await delayService.manage(req.params.id, req.body ?? {}, req.user?.sub))
    } catch (err) {
      next(err)
    }
  },

  async history(req: Request, res: Response, next: NextFunction) {
    try {
      const orderId = typeof req.query.orderId === 'string' ? req.query.orderId : undefined
      const limit = req.query.limit ? Number(req.query.limit) : undefined
      res.json(await orderHistoryService.list({ orderId, limit }))
    } catch (err) {
      next(err)
    }
  },
}
