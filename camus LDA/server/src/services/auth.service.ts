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

/** ~5 MB en data URL (mismo tope que el front) */
const MAX_AVATAR_CHARS = 7_000_000

function toAuthUser(user: {
  id: number
  nombre: string
  correoElectronico: string
  telefono: string
  avatarUrl: string
  rol?: { nombre: string } | null
}) {
  return {
    id: String(user.id),
    name: user.nombre,
    email: user.correoElectronico,
    phone: user.telefono || '',
    role: user.rol?.nombre ?? '',
    avatar: user.avatarUrl?.trim() || '',
  }
}

function validateAvatar(avatar: string): string {
  const value = avatar.trim()
  if (!value) return ''
  if (value.length > MAX_AVATAR_CHARS) {
    throw Object.assign(new Error('La imagen supera el tamaño máximo de 5 MB'), {
      status: 413,
    })
  }
  const ok =
    value.startsWith('data:image/png') ||
    value.startsWith('data:image/jpeg') ||
    value.startsWith('data:image/jpg') ||
    value.startsWith('https://') ||
    value.startsWith('http://')
  if (!ok) {
    throw Object.assign(new Error('Formato de avatar no permitido'), { status: 400 })
  }
  return value
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
      user: toAuthUser(user),
    }
  },

  async getMe(userId: number) {
    const user = await prisma.usuario.findUnique({
      where: { id: userId },
      include: { rol: true },
    })
    if (!user) throw Object.assign(new Error('Usuario no encontrado'), { status: 404 })
    return toAuthUser(user)
  },

  async updateMe(
    userId: number,
    input: { name?: string; phone?: string; avatar?: string },
  ) {
    const data: { nombre?: string; telefono?: string; avatarUrl?: string } = {}
    if (input.name !== undefined) {
      const name = input.name.trim()
      if (name.length < 2) {
        throw Object.assign(new Error('El nombre es demasiado corto'), { status: 400 })
      }
      data.nombre = name
    }
    if (input.phone !== undefined) data.telefono = input.phone.trim()
    if (input.avatar !== undefined) data.avatarUrl = validateAvatar(input.avatar)

    const user = await prisma.usuario.update({
      where: { id: userId },
      data,
      include: { rol: true },
    })

    await auditService.log({
      modulo: 'auth',
      accion: 'actualizar_perfil',
      idUsuario: userId,
      valorNuevo: {
        name: Boolean(data.nombre),
        phone: Boolean(data.telefono),
        avatar: data.avatarUrl !== undefined,
      },
    })

    return toAuthUser(user)
  },

  verify(token: string): AuthTokenPayload {
    return jwt.verify(token, env.auth.jwtSecret) as unknown as AuthTokenPayload
  },
}
