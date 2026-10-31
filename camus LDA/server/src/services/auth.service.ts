// ============================================================
//  AuthService  -> AuthController
//  AUTH_PROVIDER=local  → email/password + JWT
//  AUTH_PROVIDER=firebase → idToken Firebase + JWT de app / verify híbrido
// ============================================================
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { prisma } from '../db/prisma.js'
import { env } from '../config/env.js'
import { auditService } from './audit.service.js'
import { getFirebaseAuth } from '../external/firebaseAdmin.js'
import { notifyAdmins } from './pushNotify.service.js'

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

function signAppToken(payload: AuthTokenPayload) {
  return jwt.sign(payload, env.auth.jwtSecret, {
    expiresIn: env.auth.jwtExpiresIn,
  } as jwt.SignOptions)
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

async function resolveUserFromFirebase(uid: string, email: string) {
  let user = await prisma.usuario.findFirst({
    where: {
      OR: [
        { firebaseUid: uid },
        { correoElectronico: email.toLowerCase() },
      ],
    },
    include: { rol: true },
  })
  if (!user) {
    throw Object.assign(
      new Error('Usuario no registrado en Camus. Pedí alta al administrador.'),
      { status: 403 },
    )
  }
  if (user.estado && user.estado !== 'Activo') {
    throw Object.assign(new Error('Usuario inactivo o bloqueado'), { status: 403 })
  }
  if (user.firebaseUid !== uid) {
    user = await prisma.usuario.update({
      where: { id: user.id },
      data: { firebaseUid: uid, ultimoAcceso: new Date() },
      include: { rol: true },
    })
  } else {
    await prisma.usuario.update({
      where: { id: user.id },
      data: { ultimoAcceso: new Date() },
    })
  }
  return user
}

export const authService = {
  async login(email: string, password: string) {
    if (env.auth.provider === 'firebase') {
      throw Object.assign(
        new Error('Usá Firebase Auth: enviá idToken en el body'),
        { status: 400 },
      )
    }
    const user = await prisma.usuario.findUnique({
      where: { correoElectronico: email },
      include: { rol: true },
    })
    if (!user) throw Object.assign(new Error('Credenciales inválidas'), { status: 401 })

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

    void notifyAdmins({
      title: 'Inicio de sesión',
      body: `${user.correoElectronico} ingresó a Camus LDA`,
      excludeUserId: user.id,
    })

    return {
      token: signAppToken(payload),
      user: toAuthUser(user),
    }
  },

  /** Login con Firebase ID token (AUTH_PROVIDER=firebase o híbrido). */
  async loginWithIdToken(idToken: string) {
    const auth = getFirebaseAuth()
    if (!auth) {
      throw Object.assign(new Error('Firebase Admin no configurado'), { status: 503 })
    }
    let decoded: { uid: string; email?: string; email_verified?: boolean }
    try {
      decoded = await auth.verifyIdToken(idToken)
    } catch {
      throw Object.assign(new Error('Token Firebase inválido'), { status: 401 })
    }
    const email = (decoded.email ?? '').toLowerCase()
    if (!email) {
      throw Object.assign(new Error('El token no incluye email'), { status: 400 })
    }

    const user = await resolveUserFromFirebase(decoded.uid, email)

    await auditService.log({
      modulo: 'auth',
      accion: 'login_firebase',
      idUsuario: user.id,
      valorNuevo: { emailVerified: Boolean(decoded.email_verified) },
    })

    const payload: AuthTokenPayload = {
      sub: user.id,
      email: user.correoElectronico,
      rol: user.rol?.nombre ?? null,
    }

    void notifyAdmins({
      title: 'Inicio de sesión',
      body: `${user.correoElectronico} ingresó a Camus LDA`,
      excludeUserId: user.id,
    })

    return {
      token: signAppToken(payload),
      user: {
        ...toAuthUser(user),
        emailVerified: Boolean(decoded.email_verified),
      },
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

  async registerDevice(userId: number, fcmToken: string, platform = 'web') {
    const token = fcmToken.trim()
    if (token.length < 20) {
      throw Object.assign(new Error('Token FCM inválido'), { status: 400 })
    }
    await prisma.dispositivoPush.upsert({
      where: { fcmToken: token },
      create: { idUsuario: userId, fcmToken: token, platform: platform.slice(0, 40) },
      update: { idUsuario: userId, platform: platform.slice(0, 40) },
    })
    return { ok: true }
  },

  async unregisterDevice(userId: number, fcmToken: string) {
    await prisma.dispositivoPush.deleteMany({
      where: { idUsuario: userId, fcmToken: fcmToken.trim() },
    })
    return { ok: true }
  },

  async verify(token: string): Promise<AuthTokenPayload> {
    try {
      return jwt.verify(token, env.auth.jwtSecret) as unknown as AuthTokenPayload
    } catch {
      /* intentar Firebase si está habilitado */
    }
    if (env.auth.provider !== 'firebase') {
      throw new Error('Token inválido')
    }
    const auth = getFirebaseAuth()
    if (!auth) throw new Error('Firebase no disponible')
    const decoded = await auth.verifyIdToken(token)
    const email = (decoded.email ?? '').toLowerCase()
    const user = await prisma.usuario.findFirst({
      where: {
        OR: [{ firebaseUid: decoded.uid }, ...(email ? [{ correoElectronico: email }] : [])],
      },
      include: { rol: true },
    })
    if (!user) throw new Error('Usuario no vinculado')
    return {
      sub: user.id,
      email: user.correoElectronico,
      rol: user.rol?.nombre ?? null,
    }
  },
}
