import type { Request, Response, NextFunction } from 'express'
import { commentService } from '../services/comment.service.js'

export const commentController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const orderId = String(req.params.id)
      res.json(await commentService.listByOrder(orderId))
    } catch (err) {
      next(err)
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const orderId = String(req.params.id)
      const content = String(req.body?.content ?? req.body?.comentario ?? '')
      const authorName =
        typeof req.body?.authorName === 'string' ? req.body.authorName : undefined
      const created = await commentService.create(
        orderId,
        content,
        req.user?.sub,
        authorName,
      )
      res.status(201).json(created)
    } catch (err) {
      next(err)
    }
  },
}
