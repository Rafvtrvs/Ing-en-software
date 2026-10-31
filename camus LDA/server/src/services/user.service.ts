import bcrypt from 'bcryptjs'
import { prisma } from '../db/prisma.js'
import { auditService } from './audit.service.js'

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

interface UserInput {
  name: string
  email: string
  phone?: string
  roleId?: string
  roleName?: string
  status?: string
  password?: string
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
    if (!input.password || input.password.length < 6) {
      const err = new Error('La contraseña debe tener al menos 6 caracteres') as Error & {
        status: number
      }
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

    const passwordHash = await bcrypt.hash(input.password, 10)
    const row = await prisma.usuario.create({
      data: {
        nombre: input.name.trim(),
        correoElectronico: email,
        telefono: input.phone?.trim() ?? '',
        passwordHash,
        idRol,
        estado: input.status || 'Activo',
      },
      include: { rol: true },
    })

    await auditService.log({
      modulo: 'usuarios',
      accion: 'crear',
      valorNuevo: { id: row.id, email: row.correoElectronico },
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
    } = {}
    if (input.name !== undefined) data.nombre = input.name.trim()
    if (input.email !== undefined) data.correoElectronico = input.email.trim().toLowerCase()
    if (input.phone !== undefined) data.telefono = input.phone.trim()
    if (input.status !== undefined) data.estado = input.status
    if (idRol !== undefined) data.idRol = idRol
    if (input.password && input.password.length >= 6) {
      data.passwordHash = await bcrypt.hash(input.password, 10)
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
      valorNuevo: { id: row.id, email: row.correoElectronico },
      idUsuario: actorId,
    })

    return toUserDto(row)
  },
}
