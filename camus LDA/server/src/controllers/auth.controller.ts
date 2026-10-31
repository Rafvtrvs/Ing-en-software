// AuthController (<< FireBase Admin SDK >> en el diagrama)
import type { Request, Response, NextFunction } from 'express'
import { authService } from '../services/auth.service.js'

export const authController = {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body ?? {}
      if (!email || !password) {
        return res.status(400).json({ error: 'email y password son requeridos' })
      }
      const result = await authService.login(email, password)
      res.json(result)
    } catch (err) {
      next(err)
    }
  },

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.user?.sub
      if (id == null) return res.status(401).json({ error: 'No autenticado' })
      const user = await authService.getMe(id)
      res.json({ user })
    } catch (err) {
      next(err)
    }
  },

  async updateMe(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.user?.sub
      if (id == null) return res.status(401).json({ error: 'No autenticado' })
      const { name, phone, avatar } = req.body ?? {}
      const user = await authService.updateMe(id, { name, phone, avatar })
      res.json({ user })
    } catch (err) {
      next(err)
    }
  },
}
