/**
 * Carga un dataset sintético de volumen en PostgreSQL para simular entorno real.
 *
 * Uso:
 *   npm run seed:load
 *   npm run seed:load -- --preset=medio
 *   npm run seed:load -- --preset=alto
 *   npm run seed:load -- --preset=estres
 *
 * Reemplaza solo datos previos de carga (OT-LOAD-*, F-LOAD-*, *@ejemplo.cl).
 * No borra el seed demo ni usuarios.
 */
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import {
  generateLoadDataset,
  LOAD_PRESETS,
  resolvePreset,
  type LoadPreset,
} from './generateLoadDataset.js'

const prisma = new PrismaClient()
const BATCH = 400

function parsePreset(argv: string[]): LoadPreset {
  const flag = argv.find((a) => a.startsWith('--preset='))
  if (flag) return resolvePreset(flag.split('=')[1])
  const idx = argv.indexOf('--preset')
  if (idx >= 0) return resolvePreset(argv[idx + 1])
  return resolvePreset(process.env.LOAD_PRESET)
}

async function clearPreviousLoad() {
  console.log('[seed:load] limpiando datos de carga previos...')
  await prisma.factura.deleteMany({ where: { numero: { startsWith: 'F-LOAD-' } } })
  await prisma.ordenTrabajo.deleteMany({ where: { id: { startsWith: 'OT-LOAD-' } } })
  await prisma.cliente.deleteMany({ where: { email: { endsWith: '@ejemplo.cl' } } })
}

async function createInBatches<T>(
  label: string,
  items: T[],
  insert: (chunk: T[]) => Promise<unknown>,
) {
  for (let i = 0; i < items.length; i += BATCH) {
    const chunk = items.slice(i, i + BATCH)
    await insert(chunk)
    const done = Math.min(i + chunk.length, items.length)
    console.log(`[seed:load] ${label}: ${done}/${items.length}`)
  }
}

async function main() {
  const preset = parsePreset(process.argv.slice(2))
  const options = LOAD_PRESETS[preset]
  console.log(`[seed:load] preset=${preset}`, options)

  const dataset = generateLoadDataset(options)
  await clearPreviousLoad()

  console.log('[seed:load] insertando clientes...')
  await createInBatches('clientes', dataset.clients, (chunk) =>
    prisma.cliente.createMany({ data: chunk, skipDuplicates: true }),
  )

  const clientesDb = await prisma.cliente.findMany({
    where: { email: { endsWith: '@ejemplo.cl' } },
    select: { id: true, rut: true },
  })
  const idByRut = new Map(clientesDb.map((c) => [c.rut, c.id]))

  const operador = await prisma.usuario.findFirst({
    where: { correoElectronico: 'operador@camus.cl' },
    select: { id: true },
  })

  const orderRows = dataset.orders.map((o) => ({
    id: o.id,
    fechaEmision: o.fechaEmision,
    estado: o.estado,
    prioridad: o.prioridad,
    servicio: o.servicio,
    categoria: o.categoria,
    direccion: o.direccion,
    latitud: o.latitud,
    longitud: o.longitud,
    fechaLimite: o.fechaLimite,
    progreso: o.progreso,
    ordenVisual: o.ordenVisual,
    idCliente: idByRut.get(o.clientRut) ?? null,
    idOperador: operador?.id ?? null,
  }))

  console.log('[seed:load] insertando órdenes...')
  await createInBatches('ordenes', orderRows, (chunk) =>
    prisma.ordenTrabajo.createMany({ data: chunk, skipDuplicates: true }),
  )

  const invoiceRows = dataset.invoices.map((inv) => ({
    numero: inv.numero,
    idCliente: idByRut.get(inv.clientRut) ?? null,
    idOt: inv.orderId,
    fechaEmision: inv.fechaEmision,
    fechaVencimiento: inv.fechaVencimiento,
    monto: inv.monto,
    estado: inv.estado,
    metodoPago: inv.metodoPago,
    pagadaEn: inv.pagadaEn,
  }))

  console.log('[seed:load] insertando facturas...')
  await createInBatches('facturas', invoiceRows, (chunk) =>
    prisma.factura.createMany({ data: chunk, skipDuplicates: true }),
  )

  console.log('[seed:load] listo.')
  console.log(
    `  ${dataset.clients.length} clientes · ${dataset.orders.length} OT · ${dataset.invoices.length} facturas (seed ${dataset.seed})`,
  )
  console.log('  Reinicia/recarga el frontend con API activa para ver los KPIs desde Postgres.')
}

main()
  .catch((e) => {
    console.error('[seed:load] error', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
