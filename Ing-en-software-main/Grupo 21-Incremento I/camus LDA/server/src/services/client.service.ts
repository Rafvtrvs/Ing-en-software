// ============================================================
//  ClientService (Lógica del negocio)
//  Usado por ClientController. Habla con la BD vía Prisma y registra
//  auditoría en cada mutación.
// ============================================================
import { prisma } from '../db/prisma.js'
import { auditService } from './audit.service.js'
import { toClientDto } from './mappers.js'

interface ClientInput {
  name: string
  company?: string
  rut: string
  phone?: string
  email?: string
  status?: string
  lastOrder?: string
}

export const clientService = {
  async list() {
    const rows = await prisma.cliente.findMany({ orderBy: { creadoEn: 'desc' } })
    return rows.map(toClientDto)
  },

  async get(id: number) {
    const row = await prisma.cliente.findUnique({ where: { id } })
    return row ? toClientDto(row) : null
  },

  async create(input: ClientInput, userId?: number) {
    const row = await prisma.cliente.create({
      data: {
        nombre: input.name,
        empresa: input.company ?? '',
        rut: input.rut,
        telefono: input.phone ?? '',
        email: input.email ?? '',
        estado: input.status ?? 'Activo',
        ultimaOrden: input.lastOrder ?? '',
      },
    })
    await auditService.log({
      modulo: 'clientes',
      accion: 'crear',
      valorNuevo: row,
      idUsuario: userId,
    })
    return toClientDto(row)
  },

  async update(id: number, input: Partial<ClientInput>, userId?: number) {
    const before = await prisma.cliente.findUnique({ where: { id } })
    const row = await prisma.cliente.update({
      where: { id },
      data: {
        nombre: input.name,
        empresa: input.company,
        rut: input.rut,
        telefono: input.phone,
        email: input.email,
        estado: input.status,
        ultimaOrden: input.lastOrder,
      },
    })
    await auditService.log({
      modulo: 'clientes',
      accion: 'actualizar',
      valorAnterior: before,
      valorNuevo: row,
      idUsuario: userId,
    })
    return toClientDto(row)
  },

  async remove(id: number, userId?: number) {
    const before = await prisma.cliente.findUnique({ where: { id } })
    await prisma.cliente.delete({ where: { id } })
    await auditService.log({
      modulo: 'clientes',
      accion: 'eliminar',
      valorAnterior: before,
      idUsuario: userId,
    })
  },
}
