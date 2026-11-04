import bcrypt from 'bcryptjs'
import { prisma } from '../db/prisma.js'
import { env } from '../config/env.js'
import { getFirebaseAuth } from '../external/firebaseAdmin.js'
import { auditService } from './audit.service.js'

/**
 * Crea o vincula el usuario en Firebase Auth y devuelve el uid.
 * Si AUTH_PROVIDER=firebase y no hay Admin SDK, falla (no dejamos altas a medias).
 */
async function ensureFirebaseAuthUser(opts: {
  email: string
  password: string
  displayName: string
  existingUid?: string
}): Promise<string | null> {
  const auth = getFirebaseAuth()
  if (!auth) {
    if (env.auth.provider === 'firebase') {
      const err = new Error(
        'Firebase Admin no está configurado: no se puede crear el usuario en Authentication',
      ) as Error & { status: number }
      err.status = 503
      throw err
    }
    return null
  }

  const email = opts.email.trim().toLowerCase()

  if (opts.existingUid) {
    try {
      await auth.updateUser(opts.existingUid, {
        email,
        password: opts.password,
        displayName: opts.displayName,
        disabled: false,
      })
      return opts.existingUid
    } catch (e: unknown) {
      const code = (e as { code?: string }).code
      if (code !== 'auth/user-not-found') throw mapFirebaseAuthError(e)
    }
  }

  try {
    const created = await auth.createUser({
      email,
      password: opts.password,
      displayName: opts.displayName,
      emailVerified: false,
      disabled: false,
    })
    return created.uid
  } catch (e: unknown) {
    const code = (e as { code?: string }).code
    if (code === 'auth/email-already-exists') {
      const existing = await auth.getUserByEmail(email)
      await auth.updateUser(existing.uid, {
        password: opts.password,
        displayName: opts.displayName,
        disabled: false,
      })
      return existing.uid
    }
    throw mapFirebaseAuthError(e)
  }
}

async function syncFirebasePasswordAndProfile(opts: {
  uid: string
  email?: string
  password?: string
  displayName?: string
  disabled?: boolean
}) {
  const auth = getFirebaseAuth()
  if (!auth) {
    if (env.auth.provider === 'firebase' && opts.password) {
      const err = new Error(
        'Firebase Admin no está configurado: no se pudo actualizar la contraseña en Authentication',
      ) as Error & { status: number }
      err.status = 503
      throw err
    }
    return
  }
  try {
    await auth.updateUser(opts.uid, {
      ...(opts.email ? { email: opts.email } : null),
      ...(opts.password ? { password: opts.password } : null),
      ...(opts.displayName !== undefined ? { displayName: opts.displayName } : null),
      ...(opts.disabled !== undefined ? { disabled: opts.disabled } : null),
    })
  } catch (e: unknown) {
    const code = (e as { code?: string }).code
    if (code === 'auth/user-not-found' && opts.password && opts.email) {
      const created = await auth.createUser({
        uid: opts.uid,
        email: opts.email,
        password: opts.password,
        displayName: opts.displayName,
        disabled: opts.disabled ?? false,
      })
      return created.uid
    }
    throw mapFirebaseAuthError(e)
  }
}

function mapFirebaseAuthError(e: unknown): Error & { status: number } {
  const code = (e as { code?: string }).code ?? ''
  const message = (e as { message?: string }).message ?? 'Error de Firebase Auth'
  const err = new Error(message) as Error & { status: number }
  if (code === 'auth/invalid-password' || code === 'auth/weak-password') {
    err.message = 'La contraseña no cumple la política de Firebase (mín. 6 caracteres)'
    err.status = 400
  } else if (code === 'auth/invalid-email') {
    err.message = 'Email inválido para Firebase Auth'
    err.status = 400
  } else if (code === 'auth/email-already-exists') {
    err.message = 'Ese email ya existe en Firebase Auth'
    err.status = 409
  } else {
    err.message = `Firebase Auth: ${message}`
    err.status = 502
  }
  return err
}

function toUserDto(u: {
  id: number
  nombre: string
  correoElectronico: string
  telefono: string
  estado: string
  ultimoAcceso: Date | null
  idRol: number | null
  avatarUrl?: string | null
  rol?: { id: number; nombre: string } | null
}) {
  const stored = u.avatarUrl?.trim()
  return {
    id: String(u.id),
    name: u.nombre,
    email: u.correoElectronico,
    phone: u.telefono || '',
    roleId: u.idRol != null ? String(u.idRol) : '',
    roleName: u.rol?.nombre ?? '',
    status: u.estado,
    lastLogin: u.ultimoAcceso ? u.ultimoAcceso.toISOString() : '—',
    createdAt: undefined as string | undefined,
    avatar:
      stored ||
      `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.nombre)}`,
    emailLinked: Boolean(u.correoElectronico),
  }
}

function toRoleDto(r: {
  id: number
  nombre: string
  descripcion: string
  estado: string
  esSistema: boolean
  permisos?: { permiso: { clave: string } }[]
}) {
  const permissions = (r.permisos ?? [])
    .map((p) => p.permiso.clave)
    .filter(Boolean)
  return {
    id: String(r.id),
    name: r.nombre,
    description: r.descripcion || '',
    permissions,
    status: (r.estado === 'Inactivo' ? 'Inactivo' : 'Activo') as 'Activo' | 'Inactivo',
    isSystem: r.esSistema,
  }
}

const MAX_AVATAR_CHARS = 7_000_000

function normalizeAvatar(avatar?: string | null): string | undefined {
  if (avatar === undefined) return undefined
  const value = (avatar ?? '').trim()
  if (!value) return ''
  if (value.length > MAX_AVATAR_CHARS) {
    const err = new Error('La imagen supera el tamaño máximo de 5 MB') as Error & {
      status: number
    }
    err.status = 413
    throw err
  }
  const ok =
    value.startsWith('data:image/png') ||
    value.startsWith('data:image/jpeg') ||
    value.startsWith('data:image/jpg') ||
    value.startsWith('https://') ||
    value.startsWith('http://')
  if (!ok) {
    const err = new Error('Formato de avatar no permitido') as Error & { status: number }
    err.status = 400
    throw err
  }
  return value
}

interface UserInput {
  name: string
  email: string
  phone?: string
  roleId?: string
  roleName?: string
  status?: string
  password?: string
  avatar?: string
}

async function resolveRoleId(input: {
  roleId?: string
  roleName?: string
}): Promise<number | null> {
  if (input.roleId && /^\d+$/.test(input.roleId)) {
    const byId = await prisma.rol.findUnique({ where: { id: Number(input.roleId) } })
    if (byId) return byId.id
  }
  if (input.roleName?.trim()) {
    const byName = await prisma.rol.findFirst({
      where: { nombre: { equals: input.roleName.trim(), mode: 'insensitive' } },
    })
    if (byName) return byName.id
  }
  // Mapeo de ids mock del frontend
  const mockMap: Record<string, string> = {
    'role-admin': 'Administrador',
    'role-supervisor': 'Supervisor',
    'role-tecnico': 'Técnico de Campo',
    'role-contabilidad': 'Contabilidad',
    'role-inventario': 'Encargado de Inventario',
  }
  const mapped = input.roleId ? mockMap[input.roleId] : undefined
  if (mapped) {
    const byMapped = await prisma.rol.findFirst({
      where: { nombre: { equals: mapped, mode: 'insensitive' } },
    })
    if (byMapped) return byMapped.id
  }
  return null
}

export const userService = {
  async listRoles() {
    const rows = await prisma.rol.findMany({
      include: { permisos: { include: { permiso: true } } },
      orderBy: { id: 'asc' },
    })
    return rows.map(toRoleDto)
  },

  async list() {
    const rows = await prisma.usuario.findMany({
      include: { rol: true },
      orderBy: { id: 'asc' },
    })
    return rows.map(toUserDto)
  },

  async create(input: UserInput, actorId?: number) {
    const email = input.email?.trim().toLowerCase()
    if (!email) {
      const err = new Error('El email es obligatorio') as Error & { status: number }
      err.status = 400
      throw err
    }
    const minPass = env.auth.provider === 'firebase' ? 8 : 6
    if (!input.password || input.password.length < minPass) {
      const err = new Error(
        `La contraseña debe tener al menos ${minPass} caracteres`,
      ) as Error & { status: number }
      err.status = 400
      throw err
    }
    if (!input.name?.trim()) {
      const err = new Error('El nombre es obligatorio') as Error & { status: number }
      err.status = 400
      throw err
    }

    const existing = await prisma.usuario.findUnique({
      where: { correoElectronico: email },
    })
    if (existing) {
      const err = new Error('Ya existe un usuario con ese email') as Error & {
        status: number
        field?: string
      }
      err.status = 409
      err.field = 'email'
      throw err
    }

    const idRol = await resolveRoleId(input)
    if (idRol == null) {
      const err = new Error(
        'Rol no encontrado en la base de datos. Usa Administrador o Técnico de Campo, o créalo con el seed.',
      ) as Error & { status: number }
      err.status = 400
      throw err
    }

    // 1) Firebase Auth (si hay Admin / modo firebase) → 2) Postgres con firebaseUid
    const displayName = input.name.trim()
    const firebaseUid = await ensureFirebaseAuthUser({
      email,
      password: input.password,
      displayName,
    })

    const passwordHash = await bcrypt.hash(input.password, 10)
    const avatarUrl = normalizeAvatar(input.avatar)
    let row
    try {
      row = await prisma.usuario.create({
        data: {
          nombre: displayName,
          correoElectronico: email,
          telefono: input.phone?.trim() ?? '',
          passwordHash,
          idRol,
          estado: input.status || 'Activo',
          ...(firebaseUid ? { firebaseUid } : null),
          ...(avatarUrl !== undefined ? { avatarUrl } : null),
        },
        include: { rol: true },
      })
    } catch (dbErr) {
      // Evitar usuario huérfano en Firebase si falló Postgres
      if (firebaseUid) {
        try {
          await getFirebaseAuth()?.deleteUser(firebaseUid)
        } catch {
          /* ignore */
        }
      }
      throw dbErr
    }

    await auditService.log({
      modulo: 'usuarios',
      accion: 'crear',
      valorNuevo: {
        id: row.id,
        email: row.correoElectronico,
        firebaseUid: firebaseUid || undefined,
      },
      idUsuario: actorId,
    })

    return toUserDto(row)
  },

  async update(id: number, input: Partial<UserInput>, actorId?: number) {
    const before = await prisma.usuario.findUnique({ where: { id } })
    if (!before) {
      const err = new Error('Usuario no encontrado') as Error & { status: number }
      err.status = 404
      throw err
    }

    let idRol: number | null | undefined = undefined
    if (input.roleId !== undefined || input.roleName !== undefined) {
      idRol = await resolveRoleId({
        roleId: input.roleId,
        roleName: input.roleName,
      })
      if (idRol == null) {
        const err = new Error('Rol no encontrado') as Error & { status: number }
        err.status = 400
        throw err
      }
    }

    if (input.email && input.email.trim().toLowerCase() !== before.correoElectronico) {
      const clash = await prisma.usuario.findUnique({
        where: { correoElectronico: input.email.trim().toLowerCase() },
      })
      if (clash) {
        const err = new Error('Ya existe un usuario con ese email') as Error & {
          status: number
        }
        err.status = 409
        throw err
      }
    }

    const data: {
      nombre?: string
      correoElectronico?: string
      telefono?: string
      estado?: string
      idRol?: number | null
      passwordHash?: string
      avatarUrl?: string
      firebaseUid?: string
    } = {}
    if (input.name !== undefined) data.nombre = input.name.trim()
    if (input.email !== undefined) data.correoElectronico = input.email.trim().toLowerCase()
    if (input.phone !== undefined) data.telefono = input.phone.trim()
    if (input.status !== undefined) data.estado = input.status
    if (idRol !== undefined) data.idRol = idRol
    const minPass = env.auth.provider === 'firebase' ? 8 : 6
    if (input.password && input.password.length > 0 && input.password.length < minPass) {
      const err = new Error(
        `La contraseña debe tener al menos ${minPass} caracteres`,
      ) as Error & { status: number }
      err.status = 400
      throw err
    }
    if (input.password && input.password.length >= minPass) {
      data.passwordHash = await bcrypt.hash(input.password, 10)
    }
    if (input.avatar !== undefined) {
      data.avatarUrl = normalizeAvatar(input.avatar) ?? ''
    }

    const nextEmail = data.correoElectronico ?? before.correoElectronico
    const nextName = data.nombre ?? before.nombre
    const nextStatus = data.estado ?? before.estado
    const disabled = nextStatus !== 'Activo'

    // Mantener Firebase alineado (clave / email / baja lógica)
    if (before.firebaseUid) {
      await syncFirebasePasswordAndProfile({
        uid: before.firebaseUid,
        email: nextEmail,
        displayName: nextName,
        ...(input.password && input.password.length >= minPass
          ? { password: input.password }
          : null),
        disabled,
      })
    } else if (input.password && input.password.length >= minPass) {
      const uid = await ensureFirebaseAuthUser({
        email: nextEmail,
        password: input.password,
        displayName: nextName,
      })
      if (uid) data.firebaseUid = uid
    }

    const row = await prisma.usuario.update({
      where: { id },
      data,
      include: { rol: true },
    })

    await auditService.log({
      modulo: 'usuarios',
      accion: 'actualizar',
      valorAnterior: { id: before.id, email: before.correoElectronico },
      valorNuevo: {
        id: row.id,
        email: row.correoElectronico,
        firebaseUid: row.firebaseUid || undefined,
      },
      idUsuario: actorId,
    })

    return toUserDto(row)
  },

  /**
   * Eliminación real: Firebase Auth + Postgres.
   * Libera FKs (operador en OT, bitácora) antes de borrar la fila.
   */
  async remove(id: number, actorId?: number) {
    const before = await prisma.usuario.findUnique({ where: { id } })
    if (!before) {
      const err = new Error('Usuario no encontrado') as Error & { status: number }
      err.status = 404
      throw err
    }
    if (actorId != null && actorId === id) {
      const err = new Error('No podés eliminar tu propia cuenta') as Error & { status: number }
      err.status = 400
      throw err
    }

    const auth = getFirebaseAuth()
    if (auth) {
      try {
        if (before.firebaseUid) {
          await auth.deleteUser(before.firebaseUid)
        } else if (before.correoElectronico) {
          const fbUser = await auth.getUserByEmail(before.correoElectronico)
          await auth.deleteUser(fbUser.uid)
        }
      } catch (e: unknown) {
        const code = (e as { code?: string }).code
        // Ya no existe en Firebase: seguimos con Postgres
        if (code !== 'auth/user-not-found') {
          if (env.auth.provider === 'firebase') {
            throw mapFirebaseAuthError(e)
          }
          console.warn('[users] no se pudo borrar en Firebase Auth', e)
        }
      }
    } else if (env.auth.provider === 'firebase') {
      const err = new Error(
        'Firebase Admin no está configurado: no se puede eliminar la cuenta en Authentication',
      ) as Error & { status: number }
      err.status = 503
      throw err
    }

    await prisma.$transaction(async (tx) => {
      await tx.ordenTrabajo.updateMany({
        where: { idOperador: id },
        data: { idOperador: null },
      })
      await tx.bitacoraAuditoria.updateMany({
        where: { idUsuario: id },
        data: { idUsuario: null },
      })
      // dispositivo_push tiene onDelete: Cascade
      await tx.usuario.delete({ where: { id } })
    })

    await auditService.log({
      modulo: 'usuarios',
      accion: 'eliminar',
      valorAnterior: {
        id: before.id,
        email: before.correoElectronico,
        firebaseUid: before.firebaseUid || undefined,
      },
      idUsuario: actorId,
    })

    return { ok: true }
  },
}
