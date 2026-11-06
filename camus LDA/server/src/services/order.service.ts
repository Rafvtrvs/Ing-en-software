// ============================================================
//  OrderService (Lógica del negocio)  -> OrderController
//  Notifica por correo/push (simulados) al crear órdenes, tal como
//  muestra el diagrama (Servicios externos).
// ============================================================
import { prisma } from '../db/prisma.js'
import { auditService } from './audit.service.js'
import { toOrderDto } from './mappers.js'
import { mailOpsRecipient, mailService } from '../external/mail.service.js'

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
  latitude?: number
  longitude?: number
  dueDate?: string
  startDate?: string | null
  endDate?: string | null
  durationHours?: number | null
  truckCode?: string | null
  equipmentId?: string | null
}

/** Parsea yyyy-mm-dd / ISO → Date; ''/null limpia; undefined = no tocar. */
function parseOptionalDate(
  value: string | null | undefined,
): Date | null | undefined {
  if (value === undefined) return undefined
  if (value === null || String(value).trim() === '') return null
  const raw = String(value).trim()
  const isoDay = /^\d{4}-\d{2}-\d{2}/.test(raw) ? raw.slice(0, 10) : raw
  // Mediodía UTC: el día calendario no se corre al serializar con getUTC*
  const d = new Date(
    /^\d{4}-\d{2}-\d{2}$/.test(isoDay) ? `${isoDay}T12:00:00.000Z` : raw,
  )
  return Number.isNaN(d.getTime()) ? null : d
}

async function resolveMaquinaria(input: {
  equipmentId?: string | null
  truckCode?: string | null
}): Promise<{ idMaquinaria: number | null; codigoCamion: string | null } | undefined> {
  // Si ninguno viene en el payload, no tocar asignación de camión
  if (input.equipmentId === undefined && input.truckCode === undefined) {
    return undefined
  }

  const code = input.truckCode?.trim() || ''
  const eqRaw = input.equipmentId?.trim() || ''

  if (!code && !eqRaw) {
    return { idMaquinaria: null, codigoCamion: null }
  }

  if (eqRaw) {
    const asNum = Number(eqRaw)
    if (Number.isFinite(asNum) && String(asNum) === eqRaw) {
      const byId = await prisma.maquinaria.findUnique({ where: { id: asNum } })
      if (byId) {
        return {
          idMaquinaria: byId.id,
          codigoCamion: byId.codigo?.trim() || code || null,
        }
      }
    }
  }

  if (code) {
    const byCode = await prisma.maquinaria.findFirst({
      where: { codigo: { equals: code, mode: 'insensitive' } },
    })
    if (byCode) {
      return { idMaquinaria: byCode.id, codigoCamion: byCode.codigo || code }
    }
    return { idMaquinaria: null, codigoCamion: code }
  }

  return { idMaquinaria: null, codigoCamion: null }
}

const ACTIVE_ORDER_STATUSES = ['Pendiente', 'En Curso'] as const

/** Un camión en una OT pendiente o en curso no puede asignarse a otra. */
async function assertTruckAvailable(
  maquinaria: { idMaquinaria: number | null; codigoCamion: string | null } | undefined,
  opts: { excludeOrderId?: string; status?: string },
) {
  if (!maquinaria) return
  if (!maquinaria.idMaquinaria && !maquinaria.codigoCamion) return
  const status = opts.status ?? 'Pendiente'
  if (!ACTIVE_ORDER_STATUSES.includes(status as (typeof ACTIVE_ORDER_STATUSES)[number])) {
    return
  }

  const or: Array<{ idMaquinaria?: number; codigoCamion?: { equals: string; mode: 'insensitive' } }> = []
  if (maquinaria.idMaquinaria != null) or.push({ idMaquinaria: maquinaria.idMaquinaria })
  if (maquinaria.codigoCamion) {
    or.push({ codigoCamion: { equals: maquinaria.codigoCamion, mode: 'insensitive' } })
  }

  const conflict = await prisma.ordenTrabajo.findFirst({
    where: {
      estado: { in: [...ACTIVE_ORDER_STATUSES] },
      ...(opts.excludeOrderId ? { id: { not: opts.excludeOrderId } } : {}),
      OR: or,
    },
    select: { id: true, codigoCamion: true },
  })
  if (!conflict) return

  const label = conflict.codigoCamion || maquinaria.codigoCamion || 'El camión'
  const e: any = new Error(`${label} ya está asignado a la orden ${conflict.id}`)
  e.status = 409
  e.field = 'truckCode'
  throw e
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

async function genId() {
  const year = new Date().getFullYear()
  const prefix = `OT-${year}-`
  const rows = await prisma.ordenTrabajo.findMany({
    where: { id: { startsWith: prefix } },
    select: { id: true },
  })
  let max = 0
  for (const row of rows) {
    const n = parseInt(row.id.slice(prefix.length), 10)
    if (!Number.isNaN(n)) max = Math.max(max, n)
  }
  return `${prefix}${String(max + 1).padStart(4, '0')}`
}

async function resolveCliente(name?: string): Promise<number | null> {
  if (!name) return null
  const c = await prisma.cliente.findFirst({
    where: { OR: [{ nombre: name }, { empresa: name }] },
  })
  return c?.id ?? null
}

/** ¿El usuario autenticado es técnico/operador de campo? */
async function resolveFieldOperatorActor(
  userId?: number,
): Promise<{ id: number; name: string } | null> {
  if (userId == null || !Number.isFinite(userId)) return null
  const user = await prisma.usuario.findUnique({
    where: { id: userId },
    include: { rol: true },
  })
  if (!user || user.estado !== 'Activo') return null
  const role = (user.rol?.nombre ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
  const isField =
    role.includes('tecnico') ||
    role.includes('operador') ||
    role.includes('operario') ||
    role.includes('campo')
  if (!isField) return null
  return { id: user.id, name: user.nombre }
}

function calendarDay(value: Date | string | null | undefined): string {
  if (!value) return ''
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return ''
    return value.toISOString().slice(0, 10)
  }
  const raw = String(value).trim()
  return raw ? raw.slice(0, 10) : ''
}

/**
 * El operario puede iniciar o finalizar el servicio.
 * Cualquier otro cambio de campos queda para aprobación del administrador.
 */
function operatorUpdateNeedsApproval(
  before: {
    direccion: string
    servicio: string
    categoria: string
    estado: string
    prioridad: string
    progreso: number
    nombreCliente: string
    codigoCamion: string | null
    idMaquinaria: number | null
    fechaInicio: Date | null
    fechaTermino: Date | null
    duracionHoras: number | null
    latitud: number | null
    longitud: number | null
    idOperador: number | null
  },
  input: Partial<OrderInput>,
): boolean {
  const diffs: string[] = []
  const mark = (name: string, changed: boolean) => {
    if (changed) diffs.push(name)
  }

  if (input.address !== undefined) {
    mark('address', input.address.trim() !== (before.direccion ?? '').trim())
  }
  if (input.service !== undefined) {
    mark('service', input.service.trim() !== (before.servicio ?? '').trim())
  }
  if (input.category !== undefined) {
    mark('category', input.category.trim() !== (before.categoria ?? '').trim())
  }
  if (input.priority !== undefined) {
    mark('priority', input.priority.trim() !== (before.prioridad ?? '').trim())
  }
  if (input.client !== undefined) {
    mark('client', input.client.trim() !== (before.nombreCliente ?? '').trim())
  }
  if (input.progress !== undefined) {
    mark('progress', Number(input.progress) !== Number(before.progreso ?? 0))
  }
  if (input.truckCode !== undefined) {
    mark(
      'truckCode',
      (input.truckCode ?? '').trim() !== (before.codigoCamion ?? '').trim(),
    )
  }
  if (input.equipmentId !== undefined) {
    const next = input.equipmentId?.trim() || ''
    const prev = before.idMaquinaria != null ? String(before.idMaquinaria) : ''
    mark('equipmentId', next !== prev)
  }
  if (input.startDate !== undefined) {
    mark('startDate', calendarDay(input.startDate) !== calendarDay(before.fechaInicio))
  }
  if (input.endDate !== undefined) {
    mark('endDate', calendarDay(input.endDate) !== calendarDay(before.fechaTermino))
  }
  if (input.durationHours !== undefined) {
    const next = input.durationHours == null ? '' : String(input.durationHours)
    const prev = before.duracionHoras == null ? '' : String(before.duracionHoras)
    mark('durationHours', next !== prev)
  }
  if (input.latitude !== undefined) {
    mark('latitude', Number(input.latitude) !== Number(before.latitud ?? NaN))
  }
  if (input.longitude !== undefined) {
    mark('longitude', Number(input.longitude) !== Number(before.longitud ?? NaN))
  }
  if (input.status !== undefined) {
    mark('status', input.status !== before.estado)
  }
  if (input.operatorIds !== undefined || input.technician !== undefined || input.idOperador !== undefined) {
    // Se resuelve más abajo solo si el resto ya no es una transición operativa.
    // La comparación fina de operador ocurre si viene un id distinto.
    if (input.idOperador !== undefined && input.idOperador !== before.idOperador) {
      mark('operator', true)
    } else if (input.operatorIds?.length) {
      const raw = Number(String(input.operatorIds[0]).trim())
      if (Number.isFinite(raw) && raw > 0 && raw !== before.idOperador) mark('operator', true)
    }
  }

  if (diffs.length === 0) return false

  const allowed = new Set(['status', 'progress', 'startDate', 'endDate', 'durationHours'])
  const operational =
    (before.estado === 'Pendiente' && input.status === 'En Curso') ||
    (before.estado === 'En Curso' && input.status === 'Completada')
  if (operational && diffs.every((d) => allowed.has(d))) return false
  return true
}

function clientLabel(row: {
  nombreCliente?: string | null
  cliente?: { nombre?: string | null; empresa?: string | null } | null
}): string {
  return (
    row.cliente?.nombre?.trim() ||
    row.nombreCliente?.trim() ||
    row.cliente?.empresa?.trim() ||
    'Cliente'
  )
}

/** Campos de negocio relevantes (ignora solo reorden visual). */
function hasBusinessFieldChange(
  before: {
    direccion: string
    servicio: string
    categoria: string
    estado: string
    prioridad: string
    progreso: number
    idCliente: number | null
    idOperador: number | null
    nombreCliente?: string | null
    codigoCamion?: string | null
    idMaquinaria?: number | null
    fechaInicio?: Date | null
    fechaTermino?: Date | null
    fechaLimite?: Date | null
    latitud?: number | null
    longitud?: number | null
  },
  after: typeof before,
): boolean {
  const keys: (keyof typeof before)[] = [
    'direccion',
    'servicio',
    'categoria',
    'estado',
    'prioridad',
    'progreso',
    'idCliente',
    'idOperador',
    'nombreCliente',
    'codigoCamion',
    'idMaquinaria',
    'latitud',
    'longitud',
  ]
  for (const k of keys) {
    if (before[k] !== after[k]) return true
  }
  const sameDay = (a?: Date | null, b?: Date | null) => {
    if (!a && !b) return true
    if (!a || !b) return false
    return a.toISOString().slice(0, 10) === b.toISOString().slice(0, 10)
  }
  if (!sameDay(before.fechaInicio, after.fechaInicio)) return true
  if (!sameDay(before.fechaTermino, after.fechaTermino)) return true
  if (!sameDay(before.fechaLimite, after.fechaLimite)) return true
  return false
}

async function resolveOperador(input: {
  technician?: string
  operatorIds?: string[]
  idOperador?: number | null
}): Promise<number | null | undefined> {
  if (input.idOperador !== undefined) return input.idOperador
  if (input.operatorIds?.length) {
    for (const raw of input.operatorIds) {
      const asNum = Number(String(raw).trim())
      if (Number.isFinite(asNum) && asNum > 0) return asNum
    }
  }
  const name = input.technician?.trim()
  if (!name) return undefined
  const byName = await prisma.usuario.findFirst({
    where: { nombre: { equals: name, mode: 'insensitive' } },
  })
  return byName?.id ?? null
}

function normalizeRoleName(role?: string | null): string {
  return (role ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

/** Técnico / operador / operario de campo: solo ve OT asignadas. */
function isFieldOperatorRole(role?: string | null): boolean {
  const n = normalizeRoleName(role)
  if (!n) return false
  if (
    n.includes('admin') ||
    n.includes('supervisor') ||
    n.includes('gerente')
  ) {
    return false
  }
  return (
    n.includes('tecnico') ||
    n.includes('operador') ||
    n.includes('operario') ||
    n.includes('campo')
  )
}

export const orderService = {
  async list(actor?: { userId?: number; role?: string | null }) {
    const fieldOnly =
      actor?.userId != null &&
      Number.isFinite(actor.userId) &&
      isFieldOperatorRole(actor.role)

    const rows = await prisma.ordenTrabajo.findMany({
      where: fieldOnly ? { idOperador: actor!.userId } : undefined,
      include: { cliente: true, operador: true },
      orderBy: { ordenVisual: 'asc' },
    })
    return rows.map(toOrderDto)
  },

  async get(id: string, actor?: { userId?: number; role?: string | null }) {
    const row = await prisma.ordenTrabajo.findUnique({
      where: { id },
      include: { cliente: true, operador: true },
    })
    if (!row) {
      const e: any = new Error('Orden no encontrada')
      e.status = 404
      throw e
    }
    if (
      actor?.userId != null &&
      isFieldOperatorRole(actor.role) &&
      row.idOperador !== actor.userId
    ) {
      const e: any = new Error('Orden no encontrada')
      e.status = 404
      throw e
    }
    return toOrderDto(row)
  },

  async create(input: OrderInput, userId?: number) {
    const requestedId = input.id?.trim() || ''
    // Idempotencia offline: si el ID ya existe, devolver la OT (no duplicar)
    if (requestedId) {
      const existing = await prisma.ordenTrabajo.findUnique({
        where: { id: requestedId },
        include: { cliente: true, operador: true },
      })
      if (existing) return toOrderDto(existing)
    }

    const idCliente = input.idCliente ?? (await resolveCliente(input.client))
    let idOperador = await resolveOperador(input)
    // Si el técnico crea la OT y no vino operador, queda asignada a quien la registra
    if (
      (idOperador === undefined || idOperador === null) &&
      userId != null &&
      Number.isFinite(userId)
    ) {
      idOperador = userId
    }
    const maquinaria = await resolveMaquinaria(input)
    await assertTruckAvailable(maquinaria, { status: input.status ?? 'Pendiente' })
    const fechaInicio = parseOptionalDate(input.startDate)
    const fechaTermino = parseOptionalDate(input.endDate)
    const fechaLimite = parseOptionalDate(input.dueDate)
    // Validar que exista dirección o coordenadas y que tengan formato válido
    requireAddressOrCoordinates(input.address, input.latitude, input.longitude)
    validateCoordinates(input.latitude, input.longitude)

    const nombreCliente = input.client?.trim() || ''
    const row = await prisma.ordenTrabajo.create({
      data: {
        id: requestedId || (await genId()),
        direccion: input.address ?? '',
        servicio: input.service ?? '',
        categoria: input.category ?? '',
        estado: input.status ?? 'Pendiente',
        prioridad: input.priority ?? 'Media',
        progreso: input.progress ?? 0,
        ordenVisual: input.sortOrder ?? 0,
        latitud: input.latitude ?? null,
        longitud: input.longitude ?? null,
        fechaLimite: fechaLimite === undefined ? null : fechaLimite,
        fechaInicio: fechaInicio === undefined ? null : fechaInicio,
        fechaTermino: fechaTermino === undefined ? null : fechaTermino,
        duracionHoras:
          input.durationHours === undefined || input.durationHours === null
            ? null
            : Number(input.durationHours),
        codigoCamion: maquinaria?.codigoCamion ?? null,
        idMaquinaria: maquinaria?.idMaquinaria ?? null,
        nombreCliente,
        idCliente,
        idOperador: idOperador ?? null,
      },
      include: { cliente: true, operador: true },
    })
    await auditService.log({
      modulo: 'ordenes',
      accion: 'crear',
      valorNuevo: { ...row, orderId: row.id },
      idUsuario: userId,
    })
    if (row.idOperador) {
      await auditService.log({
        modulo: 'ordenes',
        accion: 'asignar_operador',
        valorNuevo: {
          orderId: row.id,
          idOperador: row.idOperador,
          operador: row.operador?.nombre ?? null,
        },
        idUsuario: userId,
      })
    }
    const clienteNombre =
      row.cliente?.nombre?.trim() ||
      row.nombreCliente?.trim() ||
      row.cliente?.empresa?.trim() ||
      'Cliente'
    const operadorActor = await resolveFieldOperatorActor(userId)

    // Notificaciones externas: nunca deben tumbar la creación de la OT
    void mailService
      .send({
        to: mailOpsRecipient(),
        subject: 'Camus LDA · Notificación',
        body: `Nueva orden de trabajo\n\nID: ${row.id}\nCliente: ${clienteNombre}\nServicio: ${row.servicio?.trim() || '—'}\nDirección: ${row.direccion || '—'}${operadorActor ? `\nUsuario: ${operadorActor.name}` : ''}`,
      })
      .catch((err) => console.error('[order] mail create', err))

    const { notifyAdmins } = await import('./pushNotify.service.js')
    void notifyAdmins({
      title: `Nueva OT ${row.id}`,
      body: `${clienteNombre} · ${row.servicio?.trim() || 'Sin servicio'}`,
      link: `/ordenes?order=${encodeURIComponent(row.id)}`,
      orderId: row.id,
      notifType: 'order',
      excludeUserId: userId,
    }).catch((err) => console.error('[order] push create', err))

    return toOrderDto(row)
  },

  async update(id: string, input: Partial<OrderInput>, userId?: number) {
    const before = await prisma.ordenTrabajo.findUnique({ where: { id } })
    if (before && (await resolveFieldOperatorActor(userId))) {
      if (operatorUpdateNeedsApproval(before, input)) {
        const e: any = new Error(
          'El cambio debe ser aprobado por un administrador',
        )
        e.status = 409
        e.field = 'modification'
        throw e
      }
    }
    const idCliente =
      input.idCliente ??
      (input.client !== undefined
        ? await resolveCliente(input.client)
        : undefined)
    const idOperador = await resolveOperador(input)
    const maquinaria = await resolveMaquinaria(input)
    await assertTruckAvailable(maquinaria, {
      excludeOrderId: id,
      status: input.status ?? before?.estado ?? 'Pendiente',
    })
    const fechaInicio = parseOptionalDate(input.startDate)
    const fechaTermino = parseOptionalDate(input.endDate)
    const fechaLimite = parseOptionalDate(input.dueDate)
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
        ...(input.client !== undefined
          ? { nombreCliente: input.client.trim() }
          : null),
        ...(idOperador !== undefined ? { idOperador } : null),
        ...(input.latitude !== undefined ? { latitud: input.latitude } : null),
        ...(input.longitude !== undefined ? { longitud: input.longitude } : null),
        ...(fechaLimite !== undefined ? { fechaLimite } : null),
        ...(fechaInicio !== undefined ? { fechaInicio } : null),
        ...(fechaTermino !== undefined ? { fechaTermino } : null),
        ...(input.durationHours !== undefined
          ? {
              duracionHoras:
                input.durationHours === null ? null : Number(input.durationHours),
            }
          : null),
        ...(maquinaria !== undefined
          ? {
              codigoCamion: maquinaria.codigoCamion,
              idMaquinaria: maquinaria.idMaquinaria,
            }
          : null),
      },
      include: { cliente: true, operador: true },
    })
    await auditService.log({
      modulo: 'ordenes',
      accion: 'actualizar',
      valorAnterior: before ? { ...before, orderId: before.id } : before,
      valorNuevo: { ...row, orderId: row.id },
      idUsuario: userId,
    })

    // Asignación / reasignación de operario a cargo
    if (before && idOperador !== undefined && before.idOperador !== row.idOperador) {
      await auditService.log({
        modulo: 'ordenes',
        accion: 'asignar_operador',
        valorAnterior: {
          orderId: id,
          idOperador: before.idOperador,
        },
        valorNuevo: {
          orderId: id,
          idOperador: row.idOperador,
          operador: row.operador?.nombre ?? null,
        },
        idUsuario: userId,
      })
    }

    const { notifyAdmins } = await import('./pushNotify.service.js')
    const operadorActor = await resolveFieldOperatorActor(userId)
    const clienteNombre = clientLabel(row)
    const servicio = row.servicio?.trim() || 'Sin servicio'

    // RF29 CU-97: registrar el cambio de estado en la bitácora (Kanban / terreno)
    if (before && row.estado !== before.estado) {
      await auditService.log({
        modulo: 'ordenes',
        accion: 'cambio_estado',
        valorAnterior: { orderId: id, estado: before.estado },
        valorNuevo: { orderId: id, estado: row.estado },
        idUsuario: userId,
      })
      // RF29 CU-98: notificar el cambio de estado (FCM a administradores)
      const byOp = operadorActor ? ` Operario: ${operadorActor.name}.` : ''
      await notifyAdmins({
        title: `OT ${id}: ${before.estado} → ${row.estado}`,
        body: `${clienteNombre} · ${servicio}. Estado cambió de "${before.estado}" a "${row.estado}".${byOp}`,
        link: `/ordenes?order=${encodeURIComponent(id)}`,
        orderId: id,
        notifType: 'order',
        excludeUserId: userId,
      })

      void mailService
        .send({
          to: mailOpsRecipient(),
          subject: 'Camus LDA · Notificación',
          body: `Cambio de estado\n\nID: ${id}\nCliente: ${clienteNombre}\nServicio: ${servicio}\nEstado anterior: ${before.estado}\nEstado actual: ${row.estado}${operadorActor ? `\nUsuario: ${operadorActor.name}` : ''}`,
        })
        .catch((err) => console.error('[order] mail status', err))
    } else if (
      operadorActor &&
      before &&
      hasBusinessFieldChange(before, row)
    ) {
      // Edición de OT por operario (campos distintos del solo cambio de estado)
      await notifyAdmins({
        title: `OT ${id} editada por operario`,
        body: `${operadorActor.name} modificó la orden de ${clienteNombre} · ${servicio}.`,
        link: `/ordenes?order=${encodeURIComponent(id)}`,
        orderId: id,
        notifType: 'order',
        excludeUserId: userId,
      })
    }
    return toOrderDto(row)
  },

  async remove(id: string, userId?: number) {
    const before = await prisma.ordenTrabajo.findUnique({
      where: { id },
      include: { cliente: true },
    })
    await prisma.ordenTrabajo.delete({ where: { id } })
    await auditService.log({
      modulo: 'ordenes',
      accion: 'eliminar',
      valorAnterior: before,
      idUsuario: userId,
    })

    const operadorActor = await resolveFieldOperatorActor(userId)
    if (operadorActor && before) {
      const { notifyAdmins } = await import('./pushNotify.service.js')
      const clienteNombre = clientLabel(before)
      const servicio = before.servicio?.trim() || 'Sin servicio'
      await notifyAdmins({
        title: `OT ${id} eliminada por operario`,
        body: `${operadorActor.name} eliminó la orden de ${clienteNombre} · ${servicio}.`,
        link: `/ordenes`,
        orderId: id,
        notifType: 'order',
        excludeUserId: userId,
      })
    }
  },
}
