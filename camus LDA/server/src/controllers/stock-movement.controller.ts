import type { Request, Response, NextFunction } from 'express'
import { prisma } from '../db/prisma.js'
import { stockMovementService } from '../services/stock-movement.service.js'

async function resolveUserName(userId?: number): Promise<string | undefined> {
  if (!userId) return undefined
  const user = await prisma.usuario.findUnique({
    where: { id: userId },
    select: { nombre: true },
  })
  return user?.nombre
}

export const stockMovementController = {
  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await stockMovementService.list())
    } catch (err) {
      next(err)
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userName = await resolveUserName(req.user?.sub)
      const created = await stockMovementService.create(
        {
          ...req.body,
          user: req.body?.user || userName || 'Sistema',
        },
        req.user?.sub,
      )
      res.status(201).json(created)
    } catch (err) {
      next(err)
    }
  },
}
