// ============================================================
//  Middleware de autenticación (componente "middleware
//  << FireBase Auth + HTTPS >>" del diagrama).
//  Verifica el JWT del header Authorization y expone el usuario.
// ============================================================
import type { NextFunction, Request, Response } from 'express'
import { authService, type AuthTokenPayload } from '../services/auth.service.js'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthTokenPayload
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token requerido' })
  }
  try {
    req.user = authService.verify(header.slice(7))
    next()
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' })
  }
}

/** Variante que no bloquea: adjunta el usuario si hay token válido. */
export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (header?.startsWith('Bearer ')) {
    try {
      req.user = authService.verify(header.slice(7))
    } catch {
      /* token inválido: continúa sin usuario */
    }
  }
  next()
}
