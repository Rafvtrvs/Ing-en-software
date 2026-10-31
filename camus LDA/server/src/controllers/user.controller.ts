import type { Request, Response, NextFunction } from 'express'
import { userService } from '../services/user.service.js'

export const userController = {
  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await userService.list())
    } catch (err) {
      next(err)
    }
  },

  async listRoles(_req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await userService.listRoles())
    } catch (err) {
      next(err)
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const created = await userService.create(req.body, req.user?.sub)
      res.status(201).json(created)
    } catch (err) {
      next(err)
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await userService.update(
        Number(req.params.id),
        req.body,
        req.user?.sub,
      )
      res.json(updated)
    } catch (err) {
      next(err)
    }
  },
}
