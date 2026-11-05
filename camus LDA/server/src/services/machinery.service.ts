import { prisma } from '../db/prisma.js'
import { auditService } from './audit.service.js'
import { toEquipmentDto } from './mappers.js'

const ACTIVE_ORDER_STATUSES = new Set(['Pendiente', 'En Curso'])

interface MachineryCreateInput {
  code?: string
  name: string
  category?: string
  status?: string
  serialNumber?: string
  location?: string
  assignedTo?: string | null
  patente?: string
  marca?: string
  purchaseDate?: string
  lastMaintenance?: string
  nextMaintenance?: string
}

interface MachineryUpdateInput {
  status?: string
  lastMaintenance?: string
  nextMaintenance?: string
  assignedTo?: string | null
  location?: string
  /** Si true, no actualiza ubicacion_base (ubicación temporal por OT) */
  locationIsAssignment?: boolean
  name?: string
  category?: string
  patente?: string
  marca?: string
  purchaseDate?: string
  serialNumber?: string
}

export interface MachineryAssignmentInput {
  code: string
  orderId: string
  address: string
}

function parseDate(value?: string | null): Date | null {
  if (!value?.trim()) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

/** Snapshot plano para bitácora (sin relaciones), con fechas ISO. */
function machineryAuditSnapshot(row: {
  codigo?: string | null
  nombre?: string | null
  estado?: string | null
  numeroSerie?: string | null
  ubicacion?: string | null
  ubicacionBase?: string | null
  categoria?: string | null
  patente?: string | null
  marca?: string | null
  fechaCompra?: Date | string | null
  ultimaMantencion?: Date | string | null
  proximaMantencion?: Date | string | null
  asignadoA?: string | null
}) {
  const asDate = (v: Date | string | null | undefined) => {
    if (!v) return null
    if (v instanceof Date) return v.toISOString().slice(0, 10)
    return String(v).slice(0, 10)
  }
  return {
    codigo: row.codigo ?? '',
    nombre: row.nombre ?? '',
    estado: row.estado ?? '',
    numeroSerie: row.numeroSerie ?? '',
    ubicacion: row.ubicacion ?? '',
    ubicacionBase: row.ubicacionBase ?? '',
    categoria: row.categoria ?? '',
    patente: row.patente ?? null,
    marca: row.marca ?? null,
    fechaCompra: asDate(row.fechaCompra),
    ultimaMantencion: asDate(row.ultimaMantencion),
    proximaMantencion: asDate(row.proximaMantencion),
    asignadoA: row.asignadoA ?? null,
  }
}

function normalizeStatus(raw?: string | null): string {
  const s = (raw ?? 'Operativo').trim()
  if (s === 'Operativa') return 'Operativo'
  if (s === 'No operativa' || s === 'No operativo') return 'Fuera de servicio'
  return s || 'Operativo'
}

function assignmentLocation(orderId: string, address: string): string {
  const addr = address.trim() || 'Sin dirección'
  const id = orderId.trim()
  // El id ya suele venir como OT-2026-0128; evita "OT OT-..."
  const label = /^ot[\s_-]/i.test(id) ? id : `OT ${id}`
  return `${label} — ${addr}`.slice(0, 150)
}

function isAssignmentLocation(value?: string | null): boolean {
  return /^ot[\s_-]/i.test((value ?? '').trim())
}

function homeLocation(row: { ubicacionBase?: string | null; ubicacion?: string | null }): string {
  const base = row.ubicacionBase?.trim()
  if (base) return base
  const current = row.ubicacion?.trim()
  if (current && !isAssignmentLocation(current)) return current
  return 'Sin ubicación'
}

export const machineryService = {
  async create(input: MachineryCreateInput, userId?: number) {
    const name = input.name?.trim()
    if (!name) {
      const e = new Error('El nombre del vehículo/equipo es obligatorio') as Error & {
        status: number
      }
      e.status = 400
      throw e
    }

    const code = (input.code ?? '').trim()
    const patente = input.patente?.trim() || null
    const categoria = (input.category ?? 'Maquinaria').trim() || 'Maquinaria'
    const ubicacion =
      input.location?.trim() ||
      (patente ? `Patente ${patente}` : '') ||
      'Sin ubicación'

    const data = {
      codigo: code,
      nombre: name,
      categoria,
      estado: normalizeStatus(input.status),
      numeroSerie: input.serialNumber?.trim() || '',
      ubicacion,
      ubicacionBase: ubicacion,
      asignadoA: input.assignedTo?.trim() || null,
      patente,
      marca: input.marca?.trim() || null,
      fechaCompra: parseDate(input.purchaseDate),
      ultimaMantencion: parseDate(input.lastMaintenance),
      proximaMantencion: parseDate(input.nextMaintenance),
    }

    const existing = code
      ? await prisma.maquinaria.findFirst({ where: { codigo: code } })
      : null

    const row = existing
      ? await prisma.maquinaria.update({
          where: { id: existing.id },
          data: {
            ...data,
            // Conserva la base original si ya existía
            ubicacionBase: existing.ubicacionBase?.trim() || data.ubicacionBase,
          },
        })
      : await prisma.maquinaria.create({ data })

    await auditService.log({
      modulo: 'inventario',
      accion: existing ? 'actualizar-maquinaria' : 'crear-maquinaria',
      valorAnterior: existing ? machineryAuditSnapshot(existing) : undefined,
      valorNuevo: machineryAuditSnapshot(row),
      idUsuario: userId,
    })

    return toEquipmentDto(row)
  },

  /** Registra en maquinaria un producto de inventario si aún no existe. */
  async ensureFromAsset(input: {
    code: string
    name: string
    category: string
    status?: string
    serialNumber?: string
    location?: string
  }) {
    const code = input.code.trim()
    if (!code) return null
    const existing = await prisma.maquinaria.findFirst({ where: { codigo: code } })
    if (existing) return toEquipmentDto(existing)

    return this.create({
      code,
      name: input.name,
      category: input.category,
      status: input.status ?? 'Operativo',
      serialNumber: input.serialNumber,
      location: input.location,
    })
  },

  async list() {
    // Backfill: filas sin ubicacion_base toman la ubicación actual (si no es de OT)
    await prisma.$executeRaw`
      UPDATE maquinaria
      SET ubicacion_base = ubicacion
      WHERE (ubicacion_base IS NULL OR ubicacion_base = '')
        AND ubicacion IS NOT NULL
        AND ubicacion <> ''
        AND ubicacion NOT LIKE 'OT %'
        AND ubicacion NOT LIKE 'OT-%'
    `

    const rows = await prisma.maquinaria.findMany({
      include: {
        usos: {
          include: { orden: true },
          orderBy: { fechaUso: 'desc' },
        },
      },
      orderBy: [{ codigo: 'asc' }, { id: 'asc' }],
    })

    const orders = await prisma.ordenTrabajo.findMany({
      where: { estado: { in: [...ACTIVE_ORDER_STATUSES] } },
      select: { id: true, estado: true, direccion: true },
    })
    const activeById = new Map(orders.map((o) => [o.id, o]))

    const result = []
    for (const row of rows) {
      const activeUso = row.usos.find((u) => activeById.has(u.idOt))
      const activeOrder = activeUso ? activeById.get(activeUso.idOt) : undefined

      if (activeOrder) {
        const nextLoc = assignmentLocation(activeOrder.id, activeOrder.direccion ?? '')
        if (row.ubicacion !== nextLoc || !row.ubicacionBase?.trim()) {
          const updated = await prisma.maquinaria.update({
            where: { id: row.id },
            data: {
              ubicacion: nextLoc,
              ubicacionBase: homeLocation(row),
              estado:
                row.estado === 'Operativo' || row.estado === 'Asignado'
                  ? 'Asignado'
                  : row.estado,
              asignadoA: activeOrder.id,
            },
          })
          result.push(toEquipmentDto(updated, activeOrder.id))
          continue
        }
        result.push(toEquipmentDto(row, activeOrder.id))
        continue
      }

      // Sin OT activa: restaurar ubicación base si estaba en una asignación
      const base = homeLocation(row)
      const looksAssigned =
        isAssignmentLocation(row.ubicacion) ||
        row.estado === 'Asignado' ||
        Boolean(row.asignadoA)
      if (looksAssigned && row.ubicacion !== base) {
        const updated = await prisma.maquinaria.update({
          where: { id: row.id },
          data: {
            ubicacion: base,
            ubicacionBase: base,
            estado: row.estado === 'Asignado' ? 'Operativo' : row.estado,
            asignadoA: null,
          },
        })
        result.push(toEquipmentDto(updated))
        continue
      }

      result.push(toEquipmentDto(row))
    }

    return result
  },

  /**
   * Sincroniza ubicaciones según asignaciones del frontend (truckCode / equipmentId).
   * Crea/actualiza Utiliza y mueve ubicación a la dirección de la OT.
   */
  async syncAssignments(assignments: MachineryAssignmentInput[], userId?: number) {
    const byCode = new Map(
      assignments
        .filter((a) => a.code?.trim() && a.orderId?.trim())
        .map((a) => [a.code.trim().toUpperCase(), a]),
    )

    const rows = await prisma.maquinaria.findMany()
    const updated = []

    for (const row of rows) {
      const code = row.codigo.trim().toUpperCase()
      const assignment = byCode.get(code)

      if (assignment) {
        const nextLoc = assignmentLocation(assignment.orderId, assignment.address)
        const base = homeLocation(row)
        const saved = await prisma.maquinaria.update({
          where: { id: row.id },
          data: {
            ubicacion: nextLoc,
            ubicacionBase: base,
            estado:
              row.estado === 'Mantenimiento' || row.estado === 'Fuera de servicio'
                ? row.estado
                : 'Asignado',
            asignadoA: assignment.orderId,
          },
        })

        await prisma.utiliza.upsert({
          where: {
            idOt_idMaquinaria: {
              idOt: assignment.orderId,
              idMaquinaria: row.id,
            },
          },
          update: { fechaUso: new Date() },
          create: {
            idOt: assignment.orderId,
            idMaquinaria: row.id,
            horasUso: 0,
            fechaUso: new Date(),
          },
        })

        updated.push(toEquipmentDto(saved, assignment.orderId))
        continue
      }

      // Liberar si tenía uso activo en OT que ya no viene en assignments
      const usos = await prisma.utiliza.findMany({
        where: { idMaquinaria: row.id },
        include: { orden: true },
      })
      const activeUsos = usos.filter(
        (u) => u.orden && ACTIVE_ORDER_STATUSES.has(u.orden.estado),
      )
      const stillWanted = activeUsos.some((u) =>
        [...byCode.values()].some(
          (a) => a.orderId === u.idOt && a.code.trim().toUpperCase() === code,
        ),
      )

      if (!stillWanted && (isAssignmentLocation(row.ubicacion) || row.estado === 'Asignado')) {
        const base = homeLocation(row)
        for (const uso of activeUsos) {
          await prisma.utiliza.delete({
            where: {
              idOt_idMaquinaria: { idOt: uso.idOt, idMaquinaria: row.id },
            },
          })
        }
        const saved = await prisma.maquinaria.update({
          where: { id: row.id },
          data: {
            ubicacion: base,
            ubicacionBase: base,
            estado: row.estado === 'Asignado' ? 'Operativo' : row.estado,
            asignadoA: null,
          },
        })
        updated.push(toEquipmentDto(saved))
      }
    }

    await auditService.log({
      modulo: 'inventario',
      accion: 'sincronizar-ubicaciones-maquinaria',
      valorNuevo: { count: updated.length, assignments: assignments.length },
      idUsuario: userId,
    })

    return this.list()
  },

  async update(id: number, input: MachineryUpdateInput, userId?: number) {
    const before = await prisma.maquinaria.findUnique({
      where: { id },
      include: { usos: { include: { orden: true } } },
    })
    if (!before) {
      const e = new Error('Maquinaria no encontrada') as Error & { status: number }
      e.status = 404
      throw e
    }

    const nextStatus = input.status !== undefined ? normalizeStatus(input.status) : undefined
    if (
      nextStatus &&
      nextStatus !== before.estado &&
      (nextStatus === 'Mantenimiento' || nextStatus === 'Fuera de servicio')
    ) {
      const blocking = before.usos.find(
        (u) => u.orden && ACTIVE_ORDER_STATUSES.has(u.orden.estado),
      )
      if (blocking) {
        const e = new Error(
          `No se puede cambiar el estado: el equipo está en una orden activa (${blocking.idOt}).`,
        ) as Error & { status: number }
        e.status = 409
        throw e
      }
    }

    const locationUpdate =
      input.location !== undefined
        ? input.locationIsAssignment
          ? { ubicacion: input.location.trim() }
          : {
              // Edición del usuario: actualiza la base; la ubicación actual
              // solo cambia si no está en una OT.
              ubicacionBase: input.location.trim() || homeLocation(before),
              ...(isAssignmentLocation(before.ubicacion)
                ? {}
                : { ubicacion: input.location.trim() || homeLocation(before) }),
            }
        : {}

    const row = await prisma.maquinaria.update({
      where: { id },
      data: {
        ...(nextStatus !== undefined ? { estado: nextStatus } : {}),
        ...(input.lastMaintenance !== undefined
          ? { ultimaMantencion: parseDate(input.lastMaintenance) }
          : {}),
        ...(input.nextMaintenance !== undefined
          ? { proximaMantencion: parseDate(input.nextMaintenance) }
          : {}),
        ...(input.assignedTo !== undefined ? { asignadoA: input.assignedTo } : {}),
        ...locationUpdate,
        ...(input.name !== undefined ? { nombre: input.name } : {}),
        ...(input.category !== undefined ? { categoria: input.category } : {}),
        ...(input.patente !== undefined ? { patente: input.patente.trim() || null } : {}),
        ...(input.marca !== undefined ? { marca: input.marca.trim() || null } : {}),
        ...(input.purchaseDate !== undefined
          ? { fechaCompra: parseDate(input.purchaseDate) }
          : {}),
        ...(input.serialNumber !== undefined
          ? { numeroSerie: input.serialNumber.trim() }
          : {}),
      },
      include: {
        usos: {
          include: { orden: true },
          orderBy: { fechaUso: 'desc' },
        },
      },
    })

    await auditService.log({
      modulo: 'inventario',
      accion: 'actualizar-maquinaria',
      valorAnterior: machineryAuditSnapshot(before),
      valorNuevo: machineryAuditSnapshot(row),
      idUsuario: userId,
    })

    const activeUso = row.usos.find(
      (u) => u.orden && ACTIVE_ORDER_STATUSES.has(u.orden.estado),
    )
    return toEquipmentDto(row, activeUso?.idOt)
  },

  async remove(id: number, userId?: number) {
    const before = await prisma.maquinaria.findUnique({
      where: { id },
      include: { usos: { include: { orden: true } } },
    })
    if (!before) {
      const e = new Error('Maquinaria no encontrada') as Error & { status: number }
      e.status = 404
      throw e
    }

    const blocking = before.usos.find(
      (u) => u.orden && ACTIVE_ORDER_STATUSES.has(u.orden.estado),
    )
    if (blocking) {
      const e = new Error(
        `No se puede eliminar: el equipo está en una orden activa (${blocking.idOt}).`,
      ) as Error & { status: number }
      e.status = 409
      throw e
    }

    await prisma.utiliza.deleteMany({ where: { idMaquinaria: id } })
    await prisma.maquinaria.delete({ where: { id } })

    await auditService.log({
      modulo: 'inventario',
      accion: 'eliminar-maquinaria',
      valorAnterior: machineryAuditSnapshot(before),
      idUsuario: userId,
    })

    return { ok: true as const }
  },
}
