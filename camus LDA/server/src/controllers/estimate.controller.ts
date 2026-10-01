// EstimateController -> EstimateService (RF16 / CU-60 y CU-61)
import type { NextFunction, Request, Response } from 'express'
import { estimateService } from '../services/estimate.service.js'

function numericId(raw: string) {
  const id = Number(raw)
  if (!Number.isInteger(id)) {
    throw Object.assign(new Error('Identificador inválido'), { status: 400 })
  }
  return id
}

export const estimateController = {
  async listRates(_req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await estimateService.listRates())
    } catch (err) {
      next(err)
    }
  },

  async createRate(req: Request, res: Response, next: NextFunction) {
    try {
      res.status(201).json(await estimateService.createRate(req.body ?? {}, req.user?.sub))
    } catch (err) {
      next(err)
    }
  },

  async removeRate(req: Request, res: Response, next: NextFunction) {
    try {
      await estimateService.removeRate(numericId(req.params.id), req.user?.sub)
      res.status(204).end()
    } catch (err) {
      next(err)
    }
  },

  async calculate(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await estimateService.calculate(req.body ?? {}))
    } catch (err) {
      next(err)
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      res.status(201).json(await estimateService.create(req.body ?? {}, req.user?.sub))
    } catch (err) {
      next(err)
    }
  },

  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await estimateService.list())
    } catch (err) {
      next(err)
    }
  },

  async get(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await estimateService.get(numericId(req.params.id)))
    } catch (err) {
      next(err)
    }
  },
}
