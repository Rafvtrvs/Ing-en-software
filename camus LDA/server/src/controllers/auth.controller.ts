// AuthController
import type { Request, Response, NextFunction } from 'express'
import { authService } from '../services/auth.service.js'
import { env } from '../config/env.js'

export const authController = {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, idToken } = req.body ?? {}
      if (idToken && typeof idToken === 'string') {
        const result = await authService.loginWithIdToken(idToken)
        return res.json(result)
      }
      if (env.auth.provider === 'firebase') {
        return res.status(400).json({
          error: 'Se requiere idToken de Firebase Auth',
        })
      }
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

  async registerDevice(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.user?.sub
      if (id == null) return res.status(401).json({ error: 'No autenticado' })
      const { token, platform } = req.body ?? {}
      if (!token || typeof token !== 'string') {
        return res.status(400).json({ error: 'token FCM requerido' })
      }
      const result = await authService.registerDevice(
        id,
        token,
        typeof platform === 'string' ? platform : 'web',
      )
      res.json(result)
    } catch (err) {
      next(err)
    }
  },

  async unregisterDevice(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.user?.sub
      if (id == null) return res.status(401).json({ error: 'No autenticado' })
      const { token } = req.body ?? {}
      if (!token || typeof token !== 'string') {
        return res.status(400).json({ error: 'token FCM requerido' })
      }
      const result = await authService.unregisterDevice(id, token)
      res.json(result)
    } catch (err) {
      next(err)
    }
  },
}
