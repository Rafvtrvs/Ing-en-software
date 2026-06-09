// ============================================================
//  AuthService  -> AuthController
//
//  El diagrama define "Firebase Auth + Firebase Admin SDK". Firebase
//  Auth tiene capa gratuita, pero requiere crear un proyecto y
//  credenciales. Para que el sistema funcione localmente sin pagar ni
//  configurar nada, el proveedor por defecto es 'local' (emite JWT
//  propios). Cambiando AUTH_PROVIDER=firebase se delega en Firebase
//  sin tocar controllers ni middleware.
// ============================================================
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { prisma } from '../db/prisma.js'
import { env } from '../config/env.js'
import { auditService } from './audit.service.js'

export interface AuthTokenPayload {
  sub: number
  email: string
  rol?: string | null
}

export const authService = {
  async login(email: string, password: string) {
    const user = await prisma.usuario.findUnique({
      where: { correoElectronico: email },
      include: { rol: true },
    })
    if (!user) throw Object.assign(new Error('Credenciales inválidas'), { status: 401 })

    // Modo local: validar hash. (En modo firebase se validaría el idToken.)
    const ok = user.passwordHash
      ? await bcrypt.compare(password, user.passwordHash)
      : false
    if (!ok) throw Object.assign(new Error('Credenciales inválidas'), { status: 401 })

    await prisma.usuario.update({
      where: { id: user.id },
      data: { ultimoAcceso: new Date() },
    })
    await auditService.log({
      modulo: 'auth',
      accion: 'login',
      idUsuario: user.id,
    })

    const payload: AuthTokenPayload = {
      sub: user.id,
      email: user.correoElectronico,
      rol: user.rol?.nombre ?? null,
    }
    const token = jwt.sign(payload, env.auth.jwtSecret, {
      expiresIn: env.auth.jwtExpiresIn,
    } as jwt.SignOptions)

    return {
      token,
      user: {
        id: String(user.id),
        name: user.nombre,
        email: user.correoElectronico,
        role: user.rol?.nombre ?? '',
      },
    }
  },

  verify(token: string): AuthTokenPayload {
    return jwt.verify(token, env.auth.jwtSecret) as unknown as AuthTokenPayload
  },
}
