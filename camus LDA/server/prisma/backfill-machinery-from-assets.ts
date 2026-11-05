import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const MACHINERY_KEYS = [
  'camion',
  'vehiculo',
  'flota',
  'bomba',
  'herramient',
  'energia',
  'inspeccion',
  'equipo',
  'maquin',
]

function normalize(name: string) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function isMachineryCategory(name: string) {
  const key = normalize(name)
  return MACHINERY_KEYS.some((k) => key.includes(k) || key === k + 's')
}

function label(name: string) {
  const key = normalize(name)
  if (key.includes('camion') || key.includes('vehiculo') || key.includes('flota')) {
    return 'Vehículos'
  }
  if (key.includes('bomba')) return 'Bombas'
  if (key.includes('herramient')) return 'Herramientas'
  if (key.includes('energia')) return 'Energía'
  if (key.includes('inspeccion')) return 'Inspección'
  if (key.includes('equipo')) return 'Equipos'
  return name.trim() || 'Maquinaria'
}

async function main() {
  const assets = await prisma.insumo.findMany({ include: { categoria: true } })
  let created = 0
  let skipped = 0

  for (const asset of assets) {
    const cat = asset.categoria?.nombre ?? ''
    if (!isMachineryCategory(cat)) continue
    const code = asset.codigo.trim()
    if (!code) continue

    const existing = await prisma.maquinaria.findFirst({ where: { codigo: code } })
    if (existing) {
      skipped += 1
      continue
    }

    await prisma.maquinaria.create({
      data: {
        codigo: code,
        nombre: asset.nombre,
        categoria: label(cat),
        estado: 'Operativo',
        numeroSerie: '',
        ubicacion: 'Sin ubicación',
      },
    })
    created += 1
    console.log('created', code, asset.nombre, '→', label(cat))
  }

  console.log(JSON.stringify({ created, skipped, totalAssets: assets.length }))
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
