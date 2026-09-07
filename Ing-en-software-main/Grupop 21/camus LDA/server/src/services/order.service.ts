// ============================================================
//  OrderService (Lógica del negocio)  -> OrderController
//  Notifica por correo/push (simulados) al crear órdenes, tal como
//  muestra el diagrama (Servicios externos).
// ============================================================
import { prisma } from '../db/prisma.js'
import { auditService } from './audit.service.js'
import { toOrderDto } from './mappers.js'
import { mailService } from '../external/mail.service.js'
import { pushService } from '../external/push.service.js'

interface OrderInput {
  id?: string
  client?: string
  address?: string
  service?: string
  category?: string
  status?: string
  priority?: string
  progress?: number
  sortOrder?: number
  idCliente?: number
}

function genId() {
  const year = new Date().getFullYear()
  const rand = Math.floor(1000 + Math.random() * 9000)
  return `OT-${year}-${rand}`
}

// La Vista envía el nombre del cliente; aquí lo resolvemos al id real
// buscando por nombre o empresa para no perder el vínculo al recargar.
async function resolveCliente(name?: string): Promise<number | null> {
  if (!name) return null
  const c = await prisma.cliente.findFirst({
    where: { OR: [{ nombre: name }, { empresa: name }] },
  })
  return c?.id ?? null
}

export const orderService = {
  async list() {
    const rows = await prisma.ordenTrabajo.findMany({
      include: { cliente: true },
      orderBy: { ordenVisual: 'asc' },
    })
    return rows.map(toOrderDto)
  },

  async create(input: OrderInput, userId?: number) {
    const idCliente = input.idCliente ?? (await resolveCliente(input.client))
    const row = await prisma.ordenTrabajo.create({
      data: {
        id: input.id || genId(),
        direccion: input.address ?? '',
        servicio: input.service ?? '',
        categoria: input.category ?? '',
        estado: input.status ?? 'Pendiente',
        prioridad: input.priority ?? 'Media',
        progreso: input.progress ?? 0,
        ordenVisual: input.sortOrder ?? 0,
        idCliente,
      },
      include: { cliente: true },
    })
    await auditService.log({
      modulo: 'ordenes',
      accion: 'crear',
      valorNuevo: row,
      idUsuario: userId,
    })
    // Servicios externos (SIMULADOS)
    await mailService.send({
      to: 'operaciones@camus.cl',
      subject: `Nueva orden ${row.id}`,
      body: `Se creó la orden ${row.id}.`,
    })
    await pushService.notify({
      token: 'field-team',
      title: 'Nueva orden asignada',
      body: row.id,
    })
    return toOrderDto(row)
  },

  async update(id: string, input: Partial<OrderInput>, userId?: number) {
    const before = await prisma.ordenTrabajo.findUnique({ where: { id } })
    const idCliente =
      input.idCliente ??
      (input.client !== undefined
        ? await resolveCliente(input.client)
        : undefined)
    const row = await prisma.ordenTrabajo.update({
      where: { id },
      data: {
        direccion: input.address,
        servicio: input.service,
        categoria: input.category,
        estado: input.status,
        prioridad: input.priority,
        progreso: input.progress,
        ordenVisual: input.sortOrder,
        idCliente,
      },
      include: { cliente: true },
    })
    await auditService.log({
      modulo: 'ordenes',
      accion: 'actualizar',
      valorAnterior: before,
      valorNuevo: row,
      idUsuario: userId,
    })
    return toOrderDto(row)
  },

  async remove(id: string, userId?: number) {
    const before = await prisma.ordenTrabajo.findUnique({ where: { id } })
    await prisma.ordenTrabajo.delete({ where: { id } })
    await auditService.log({
      modulo: 'ordenes',
      accion: 'eliminar',
      valorAnterior: before,
      idUsuario: userId,
    })
  },
}
