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

  me(req: Request, res: Response) {
    res.json({ user: req.user ?? null })
  },
}
