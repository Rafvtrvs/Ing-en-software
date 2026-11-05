// ============================================================
//  InvoiceService — facturas y pagos en PostgreSQL (Prisma)
//  Paso 3: reglas de negocio (cliente, vencimiento, pagos, OT)
// ============================================================
import { prisma } from '../db/prisma.js'
import { auditService } from './audit.service.js'
import { toInvoiceDto, toPaymentDto } from './mappers.js'

const INVOICE_STATUSES = new Set([
  'Borrador',
  'Emitida',
  'Pagada',
  'Vencida',
  'Anulada',
])

const PAYMENT_METHODS = new Set(['Transferencia', 'Efectivo', 'Cheque', 'Tarjeta'])
const DEFAULT_DUE_DAYS = 30

type InvoiceInput = {
  client?: string
  clientRut?: string
  clientId?: string | number
  orderId?: string | null
  issueDate?: string
  dueDate?: string
  amount?: number
  status?: string
  paymentMethod?: string | null
  paidAt?: string | null
  notes?: string | null
  number?: string
}

type PaymentInput = {
  amount: number
  method: string
  reference?: string
  notes?: string
  date?: string
}

function httpError(message: string, status: number) {
  const err = new Error(message) as Error & { status: number }
  err.status = status
  return err
}

function parseDate(value?: string | null): Date | null {
  if (!value) return null
  const d = new Date(`${value.slice(0, 10)}T12:00:00.000Z`)
  return Number.isNaN(d.getTime()) ? null : d
}

function todayUtcDate(): Date {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 12))
}

function addDays(base: Date, days: number): Date {
  const d = new Date(base)
  d.setUTCDate(d.getUTCDate() + days)
  return d
}

function normalizeRut(rut: string): string {
  return rut.replace(/[^0-9kK]/g, '').toUpperCase()
}

async function resolveClientId(input: InvoiceInput): Promise<number | null> {
  if (input.clientId != null && String(input.clientId).trim() !== '') {
    const id = Number(input.clientId)
    if (!Number.isFinite(id)) throw httpError('clientId inválido', 400)
    const found = await prisma.cliente.findUnique({ where: { id } })
    if (!found) throw httpError('Cliente no encontrado', 404)
    return id
  }

  const rut = input.clientRut?.trim()
  if (rut) {
    const needle = normalizeRut(rut)
    const byExact = await prisma.cliente.findFirst({ where: { rut } })
    if (byExact) return byExact.id
    if (needle) {
      const all = await prisma.cliente.findMany({ select: { id: true, rut: true } })
      const match = all.find((c) => normalizeRut(c.rut) === needle)
      if (match) return match.id
    }
  }

  const name = input.client?.trim()
  if (name) {
    const byName = await prisma.cliente.findFirst({
      where: {
        OR: [
          { nombre: { equals: name, mode: 'insensitive' } },
          { empresa: { equals: name, mode: 'insensitive' } },
        ],
      },
    })
    if (byName) return byName.id
  }

  return null
}

async function assertOrderForClient(orderId?: string | null, clientId?: number | null) {
  if (!orderId) return
  const ot = await prisma.ordenTrabajo.findUnique({ where: { id: orderId } })
  if (!ot) throw httpError(`Orden ${orderId} no encontrada`, 404)
  if (clientId != null && ot.idCliente != null && ot.idCliente !== clientId) {
    throw httpError('La orden de trabajo no pertenece al cliente seleccionado', 400)
  }
}

async function nextInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `F-${year}-`
  const latest = await prisma.factura.findFirst({
    where: { numero: { startsWith: prefix } },
    orderBy: { numero: 'desc' },
    select: { numero: true },
  })
  let seq = 1
  if (latest?.numero) {
    const tail = latest.numero.slice(prefix.length)
    const n = Number(tail)
    if (Number.isFinite(n)) seq = n + 1
  }
  return `${prefix}${String(seq).padStart(4, '0')}`
}

const invoiceInclude = {
  cliente: true,
  pagos: true,
} as const

async function refreshOverdueStatuses() {
  const today = todayUtcDate()
  await prisma.factura.updateMany({
    where: {
      estado: 'Emitida',
      fechaVencimiento: { lt: today },
    },
    data: { estado: 'Vencida' },
  })
}

/** Abono parcial → OT "Abonado" (si no está cancelada). */
async function syncOrderOnPayment(orderId: string | null | undefined, fullyPaid: boolean) {
  if (!orderId || fullyPaid) return
  const order = await prisma.ordenTrabajo.findUnique({ where: { id: orderId } })
  if (!order || order.estado === 'Cancelada' || order.estado === 'Abonado') return
  await prisma.ordenTrabajo.update({
    where: { id: orderId },
    data: { estado: 'Abonado' },
  })
  await auditService.log({
    modulo: 'ordenes',
    accion: 'cambio_estado',
    valorAnterior: { orderId, estado: order.estado },
    valorNuevo: { orderId, estado: 'Abonado', motivo: 'abono_factura' },
  })
}

export const invoiceService = {
  async list() {
    await refreshOverdueStatuses()
    const rows = await prisma.factura.findMany({
      include: invoiceInclude,
      orderBy: { numero: 'desc' },
    })
    return rows.map(toInvoiceDto)
  },

  async listPayments(limit = 50) {
    const take = Math.min(Math.max(limit, 1), 200)
    const rows = await prisma.pago.findMany({
      include: { factura: { include: { cliente: true } } },
      orderBy: { fecha: 'desc' },
      take,
    })
    const fromPagos = rows.map(toPaymentDto)

    // Facturas "Pagada" sin filas en `pago` (p. ej. marcadas solo por estado)
    // también deben aparecer en Pagos recientes.
    const paidWithoutRows = await prisma.factura.findMany({
      where: {
        estado: 'Pagada',
        pagos: { none: {} },
      },
      include: { cliente: true },
      orderBy: [{ pagadaEn: 'desc' }, { fechaEmision: 'desc' }],
      take,
    })
    const synthetic = paidWithoutRows.map((f) => ({
      id: `factura-${f.id}`,
      invoiceNumber: f.numero,
      client: f.cliente?.nombre ?? f.cliente?.empresa ?? '',
      amount: Number(f.monto),
      method: f.metodoPago ?? 'Transferencia',
      date: (f.pagadaEn ?? f.fechaEmision).toISOString().slice(0, 10),
    }))

    return [...fromPagos, ...synthetic]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, take)
  },

  async get(id: number) {
    await refreshOverdueStatuses()
    const row = await prisma.factura.findUnique({
      where: { id },
      include: invoiceInclude,
    })
    return row ? toInvoiceDto(row) : null
  },

  async create(input: InvoiceInput, userId?: number) {
    const amount = Number(input.amount ?? 0)
    if (!Number.isFinite(amount) || amount <= 0) {
      throw httpError('Monto inválido', 400)
    }
    const status = input.status?.trim() || 'Borrador'
    if (!INVOICE_STATUSES.has(status)) {
      throw httpError('Estado de factura inválido', 400)
    }
    if (status === 'Pagada') {
      throw httpError('Crea la factura y registra el pago; no uses Pagada al crear', 400)
    }

    const idCliente = await resolveClientId(input)
    if (!idCliente) {
      throw httpError('Debes seleccionar un cliente registrado en el sistema', 400)
    }
    await assertOrderForClient(input.orderId, idCliente)

    const numero = input.number?.trim() || (await nextInvoiceNumber())
    const existing = await prisma.factura.findUnique({ where: { numero } })
    if (existing) throw httpError(`Ya existe la factura ${numero}`, 409)

    const issueDate = parseDate(input.issueDate) ?? todayUtcDate()
    const dueDate = parseDate(input.dueDate) ?? addDays(issueDate, DEFAULT_DUE_DAYS)

    const row = await prisma.factura.create({
      data: {
        numero,
        idCliente,
        idOt: input.orderId || null,
        fechaEmision: issueDate,
        fechaVencimiento: dueDate,
        monto: amount,
        estado: status,
        metodoPago: input.paymentMethod || null,
        pagadaEn: null,
        notas: input.notes || null,
      },
      include: invoiceInclude,
    })

    await auditService.log({
      modulo: 'facturacion',
      accion: 'crear',
      valorNuevo: row,
      idUsuario: userId,
    })
    return toInvoiceDto(row)
  },

  async update(id: number, input: Partial<InvoiceInput>, userId?: number) {
    const before = await prisma.factura.findUnique({
      where: { id },
      include: invoiceInclude,
    })
    if (!before) throw httpError('Factura no encontrada', 404)

    if (before.estado === 'Anulada') {
      throw httpError('No se puede editar una factura anulada', 400)
    }
    if (before.estado === 'Pagada' && input.amount != null) {
      throw httpError('No se puede cambiar el monto de una factura pagada', 400)
    }

    if (input.status != null && !INVOICE_STATUSES.has(input.status)) {
      throw httpError('Estado de factura inválido', 400)
    }
    if (input.paymentMethod != null && input.paymentMethod !== '') {
      if (!PAYMENT_METHODS.has(input.paymentMethod)) {
        throw httpError('Método de pago inválido', 400)
      }
    }
    if (input.amount != null) {
      const amount = Number(input.amount)
      if (!Number.isFinite(amount) || amount <= 0) throw httpError('Monto inválido', 400)
      const paid = before.pagos.reduce((sum, p) => sum + Number(p.monto), 0)
      if (amount + 0.001 < paid) {
        throw httpError('El monto no puede ser menor a lo ya pagado', 400)
      }
    }

    let idCliente = before.idCliente
    if (
      input.clientId != null ||
      input.clientRut != null ||
      input.client != null
    ) {
      idCliente = await resolveClientId(input)
      if (!idCliente) {
        throw httpError('Cliente no encontrado (revisa selección o RUT)', 404)
      }
    }

    const nextOrderId =
      input.orderId === undefined ? before.idOt : input.orderId || null
    await assertOrderForClient(nextOrderId, idCliente)

    const becomingPaid =
      input.status === 'Pagada' && before.estado !== 'Pagada'

    const row = await prisma.factura.update({
      where: { id },
      data: {
        idCliente,
        idOt: input.orderId === undefined ? undefined : input.orderId || null,
        fechaEmision: input.issueDate ? parseDate(input.issueDate) ?? undefined : undefined,
        fechaVencimiento:
          input.dueDate === undefined ? undefined : parseDate(input.dueDate),
        monto: input.amount != null ? Number(input.amount) : undefined,
        estado: input.status,
        metodoPago:
          input.paymentMethod === undefined
            ? becomingPaid
              ? before.metodoPago ?? 'Transferencia'
              : undefined
            : input.paymentMethod || null,
        pagadaEn: becomingPaid
          ? todayUtcDate()
          : input.paidAt === undefined
            ? undefined
            : parseDate(input.paidAt),
        notas: input.notes === undefined ? undefined : input.notes || null,
      },
      include: invoiceInclude,
    })

    // Si pasan el estado a Pagada desde el formulario, registrar el saldo como pago.
    if (becomingPaid) {
      const paidBefore = before.pagos.reduce((sum, p) => sum + Number(p.monto), 0)
      const remaining = Math.max(0, Number(row.monto) - paidBefore)
      if (remaining > 0) {
        await prisma.pago.create({
          data: {
            idFactura: id,
            monto: remaining,
            metodo: row.metodoPago ?? 'Transferencia',
            fecha: todayUtcDate(),
          },
        })
      }
    }

    const fresh = await prisma.factura.findUnique({
      where: { id },
      include: invoiceInclude,
    })

    await auditService.log({
      modulo: 'facturacion',
      accion: 'actualizar',
      valorAnterior: before,
      valorNuevo: fresh ?? row,
      idUsuario: userId,
    })
    return toInvoiceDto(fresh ?? row)
  },

  async remove(id: number, userId?: number) {
    const before = await prisma.factura.findUnique({
      where: { id },
      include: { pagos: true },
    })
    if (!before) throw httpError('Factura no encontrada', 404)
    if (before.estado === 'Pagada') {
      throw httpError('No se puede eliminar una factura pagada; anúlala si corresponde', 400)
    }
    if (before.pagos.length > 0) {
      throw httpError('La factura tiene pagos registrados; anúlala en lugar de eliminarla', 400)
    }
    if (before.estado !== 'Borrador' && before.estado !== 'Anulada') {
      throw httpError('Solo se pueden eliminar borradores (o anular la factura)', 400)
    }

    await prisma.pago.deleteMany({ where: { idFactura: id } })
    await prisma.factura.delete({ where: { id } })
    await auditService.log({
      modulo: 'facturacion',
      accion: 'eliminar',
      valorAnterior: before,
      idUsuario: userId,
    })
  },

  async registerPayment(id: number, input: PaymentInput, userId?: number) {
    const amount = Number(input.amount)
    if (!Number.isFinite(amount) || amount <= 0) {
      throw httpError('Monto de pago inválido', 400)
    }
    if (!PAYMENT_METHODS.has(input.method)) {
      throw httpError('Método de pago inválido', 400)
    }

    const invoice = await prisma.factura.findUnique({
      where: { id },
      include: invoiceInclude,
    })
    if (!invoice) throw httpError('Factura no encontrada', 404)
    if (invoice.estado === 'Anulada') {
      throw httpError('No se pueden registrar pagos en una factura anulada', 400)
    }
    if (invoice.estado === 'Pagada') {
      throw httpError('La factura ya está pagada', 400)
    }
    if (invoice.estado === 'Borrador') {
      throw httpError('Emite la factura antes de registrar pagos', 400)
    }

    const paidBefore = invoice.pagos.reduce((sum, p) => sum + Number(p.monto), 0)
    const total = Number(invoice.monto)
    const remaining = Math.max(0, total - paidBefore)
    if (amount > remaining + 0.001) {
      throw httpError(
        `El pago supera el saldo pendiente (${remaining.toLocaleString('es-CL')})`,
        400,
      )
    }

    const paidAfter = paidBefore + amount
    const fullyPaid = paidAfter >= total - 0.001

    const payment = await prisma.pago.create({
      data: {
        idFactura: id,
        monto: amount,
        metodo: input.method,
        fecha: parseDate(input.date) ?? todayUtcDate(),
      },
      include: { factura: { include: { cliente: true } } },
    })

    const notes =
      input.notes || input.reference
        ? [invoice.notas, input.reference && `Ref: ${input.reference}`, input.notes]
            .filter(Boolean)
            .join(' | ')
        : invoice.notas

    const nextStatus = fullyPaid
      ? 'Pagada'
      : invoice.estado === 'Vencida'
        ? 'Vencida'
        : 'Emitida'

    const updated = await prisma.factura.update({
      where: { id },
      data: {
        metodoPago: input.method,
        pagadaEn: fullyPaid ? parseDate(input.date) ?? todayUtcDate() : invoice.pagadaEn,
        estado: nextStatus,
        notas: notes,
      },
      include: invoiceInclude,
    })

    await syncOrderOnPayment(invoice.idOt, fullyPaid)

    await auditService.log({
      modulo: 'facturacion',
      accion: 'pago',
      valorAnterior: invoice,
      valorNuevo: { factura: updated, pago: payment },
      idUsuario: userId,
    })

    return {
      invoice: toInvoiceDto(updated),
      payment: toPaymentDto(payment),
    }
  },

  async markAsPaid(id: number, method: string, userId?: number) {
    if (!PAYMENT_METHODS.has(method)) {
      throw httpError('Método de pago inválido', 400)
    }
    const invoice = await prisma.factura.findUnique({
      where: { id },
      include: invoiceInclude,
    })
    if (!invoice) throw httpError('Factura no encontrada', 404)
    if (invoice.estado === 'Anulada') {
      throw httpError('No se puede pagar una factura anulada', 400)
    }
    if (invoice.estado === 'Borrador') {
      throw httpError('Emite la factura antes de marcarla como pagada', 400)
    }

    const paidBefore = invoice.pagos.reduce((sum, p) => sum + Number(p.monto), 0)
    const remaining = Math.max(0, Number(invoice.monto) - paidBefore)
    if (remaining > 0) {
      return this.registerPayment(id, { amount: remaining, method }, userId)
    }

    const updated = await prisma.factura.update({
      where: { id },
      data: {
        estado: 'Pagada',
        metodoPago: method,
        pagadaEn: todayUtcDate(),
      },
      include: invoiceInclude,
    })
    await auditService.log({
      modulo: 'facturacion',
      accion: 'marcar_pagada',
      valorAnterior: invoice,
      valorNuevo: updated,
      idUsuario: userId,
    })
    return { invoice: toInvoiceDto(updated), payment: null }
  },
}
