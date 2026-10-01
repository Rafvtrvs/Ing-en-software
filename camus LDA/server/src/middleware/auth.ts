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

/**
 * Restringe la ruta a ciertos roles. Coincide si el nombre del rol contiene alguno
 * de los indicados, sin distinguir mayúsculas/acentos (p. ej. 'tecnico' acepta
 * 'Técnico de Campo'). Debe usarse después de requireAuth.
 */
export function requireRole(...roles: string[]) {
  const norm = (s: string) =>
    s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
  const allowed = roles.map(norm)
  return (req: Request, res: Response, next: NextFunction) => {
    const rol = req.user?.rol ? norm(req.user.rol) : ''
    if (!rol || !allowed.some((a) => rol.includes(a))) {
      return res.status(403).json({ error: 'No tiene permisos para esta acción' })
    }
    next()
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
