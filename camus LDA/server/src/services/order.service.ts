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
  technician?: string
  operatorIds?: string[]
  idOperador?: number | null
  // Nuevos: coordenadas (opcionales)
  latitude?: number
  longitude?: number
  dueDate?: string
}

function validateCoordinates(lat?: number, lon?: number) {
  if (lat === undefined && lon === undefined) return
  if (lat !== undefined) {
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
      const e: any = new Error('Invalid coordinates: latitude must be between -90 and 90')
      e.status = 400
      e.field = 'latitude'
      throw e
    }
  }
  if (lon !== undefined) {
    if (!Number.isFinite(lon) || lon < -180 || lon > 180) {
      const e: any = new Error('Invalid coordinates: longitude must be between -180 and 180')
      e.status = 400
      e.field = 'longitude'
      throw e
    }
  }
}

function requireAddressOrCoordinates(address?: string, lat?: number, lon?: number) {
  const hasAddress = typeof address === 'string' && address.trim().length > 0
  const hasCoords = lat !== undefined || lon !== undefined
  if (!hasAddress && !hasCoords) {
    const e: any = new Error('Se requiere dirección o coordenadas')
    e.status = 400
    e.field = 'address'
    throw e
  }
  // si viene address, validación mínima
  if (hasAddress && address!.trim().length < 5) {
    const e: any = new Error('Dirección demasiado corta')
    e.status = 400
    e.field = 'address'
    throw e
  }
}

function genId() {
  const year = new Date().getFullYear()
  const rand = Math.floor(1000 + Math.random() * 9000)
  return `OT-${year}-${rand}`
}

async function resolveCliente(name?: string): Promise<number | null> {
  if (!name) return null
  const c = await prisma.cliente.findFirst({
    where: { OR: [{ nombre: name }, { empresa: name }] },
  })
  return c?.id ?? null
}

async function resolveOperador(input: {
  technician?: string
  operatorIds?: string[]
  idOperador?: number | null
}): Promise<number | null | undefined> {
  if (input.idOperador !== undefined) return input.idOperador
  if (input.operatorIds?.length) {
    const raw = input.operatorIds[0]
    const asNum = Number(raw)
    if (Number.isFinite(asNum) && String(asNum) === raw) return asNum
  }
  const name = input.technician?.trim()
  if (!name) return undefined
  const byName = await prisma.usuario.findFirst({ where: { nombre: name } })
  if (byName) return byName.id
  if (name.toLowerCase().includes('luis')) {
    const op = await prisma.usuario.findFirst({
      where: { correoElectronico: 'operador@camus.cl' },
    })
    return op?.id ?? null
  }
  return null
}

export const orderService = {
  async list() {
    const rows = await prisma.ordenTrabajo.findMany({
      include: { cliente: true, operador: true },
      orderBy: { ordenVisual: 'asc' },
    })
    return rows.map(toOrderDto)
  },

  async get(id: string) {
    const row = await prisma.ordenTrabajo.findUnique({ where: { id }, include: { cliente: true, operador: true } })
    if (!row) {
      const e: any = new Error('Orden no encontrada')
      e.status = 404
      throw e
    }
    return toOrderDto(row)
  },

  async create(input: OrderInput, userId?: number) {
    const idCliente = input.idCliente ?? (await resolveCliente(input.client))
    const idOperador = await resolveOperador(input)
    // Validar que exista dirección o coordenadas y que tengan formato válido
    requireAddressOrCoordinates(input.address, input.latitude, input.longitude)
    validateCoordinates(input.latitude, input.longitude)

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
        latitud: input.latitude ?? null,
        longitud: input.longitude ?? null,
        idCliente,
        idOperador: idOperador ?? null,
      },
      include: { cliente: true, operador: true },
    })
    await auditService.log({
      modulo: 'ordenes',
      accion: 'crear',
      valorNuevo: row,
      idUsuario: userId,
    })
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
    const idOperador = await resolveOperador(input)
    // Validar ubicación solo si la actualización la toca (p. ej. un cambio de estado no la envía)
    if (input.address !== undefined || input.latitude !== undefined || input.longitude !== undefined) {
      requireAddressOrCoordinates(input.address, input.latitude, input.longitude)
      validateCoordinates(input.latitude, input.longitude)
    }

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
        ...(idOperador !== undefined ? { idOperador } : null),
        ...(input.latitude !== undefined ? { latitud: input.latitude } : null),
        ...(input.longitude !== undefined ? { longitud: input.longitude } : null),
      },
      include: { cliente: true, operador: true },
    })
    await auditService.log({
      modulo: 'ordenes',
      accion: 'actualizar',
      valorAnterior: before,
      valorNuevo: row,
      idUsuario: userId,
    })
    // RF29 CU-97: registrar el cambio de estado en la bitácora
    if (before && row.estado !== before.estado) {
      await auditService.log({
        modulo: 'ordenes',
        accion: 'cambio_estado',
        valorAnterior: { orderId: id, estado: before.estado },
        valorNuevo: { orderId: id, estado: row.estado },
        idUsuario: userId,
      })
      // RF29 CU-98: notificar el cambio de estado
      await pushService.notify({
        token: 'admin',
        title: 'Cambio de estado en orden',
        body: `${id}: ${before.estado} → ${row.estado}`,
      })
    }
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
