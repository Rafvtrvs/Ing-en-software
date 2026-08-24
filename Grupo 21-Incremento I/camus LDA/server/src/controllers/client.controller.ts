// ClientController -> delega en ClientService
import type { Request, Response, NextFunction } from 'express'
import { clientService } from '../services/client.service.js'

export const clientController = {
  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await clientService.list())
    } catch (err) {
      next(err)
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const created = await clientService.create(req.body, req.user?.sub)
      res.status(201).json(created)
    } catch (err) {
      next(err)
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await clientService.update(
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
      await clientService.remove(Number(req.params.id), req.user?.sub)
      res.status(204).end()
    } catch (err) {
      next(err)
    }
  },
}
