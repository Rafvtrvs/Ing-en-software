// AssetController -> delega en AssetService (inventario/insumos)
import type { Request, Response, NextFunction } from 'express'
import { assetService } from '../services/asset.service.js'

export const assetController = {
  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await assetService.list())
    } catch (err) {
      next(err)
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const created = await assetService.create(req.body, req.user?.sub)
      res.status(201).json(created)
    } catch (err) {
      next(err)
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await assetService.update(
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
      await assetService.remove(Number(req.params.id), req.user?.sub)
      res.status(204).end()
    } catch (err) {
      next(err)
    }
  },
}
