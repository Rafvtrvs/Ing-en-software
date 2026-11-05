import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const MAQUINARIA = [
  {
    codigo: 'BOMBA-004',
    nombre: 'Bomba sumergible 3HP',
    numeroSerie: 'BS-2024-00891',
    ubicacion: 'Bodega Central — Santiago',
    estado: 'Operativo',
    categoria: 'Bombas',
    asignadoA: 'Unidad móvil 02',
    marca: 'Grundfos',
    ultimaMantencion: new Date('2026-04-10'),
    proximaMantencion: new Date('2026-07-10'),
  },
  {
    codigo: 'CAM-012',
    nombre: 'Camión hidrojet 3000 PSI',
    numeroSerie: 'CJ-2023-0045',
    ubicacion: 'Patente ABCD-12',
    estado: 'Operativo',
    categoria: 'Vehículos',
    asignadoA: 'Carlos Ruiz',
    patente: 'ABCD-12',
    marca: 'Isuzu',
    ultimaMantencion: new Date('2026-05-02'),
    proximaMantencion: new Date('2026-08-02'),
  },
  {
    codigo: 'GEN-003',
    nombre: 'Generador diésel 15 kVA',
    numeroSerie: 'GD-2022-0112',
    ubicacion: 'Obra Providencia 1234',
    estado: 'Asignado',
    categoria: 'Energía',
    asignadoA: 'Obra activa',
    marca: 'Caterpillar',
    ultimaMantencion: new Date('2026-06-01'),
    proximaMantencion: new Date('2026-06-20'),
  },
  {
    codigo: 'CAM-008',
    nombre: 'Cámara inspección CCTV',
    numeroSerie: 'CI-2025-0033',
    ubicacion: 'Bodega Central — Santiago',
    estado: 'Operativo',
    categoria: 'Inspección',
    asignadoA: 'María González',
    marca: 'Rausch',
    ultimaMantencion: new Date('2026-03-15'),
    proximaMantencion: new Date('2026-09-15'),
  },
  {
    codigo: 'COMP-002',
    nombre: 'Compresor industrial 500L',
    numeroSerie: 'CP-2021-0078',
    ubicacion: 'Taller Las Condes',
    estado: 'Fuera de servicio',
    categoria: 'Herramientas',
    marca: 'Atlas Copco',
    ultimaMantencion: new Date('2026-01-20'),
    proximaMantencion: new Date('2026-06-25'),
  },
  {
    codigo: 'BOMBA-009',
    nombre: 'Bomba de achique portátil',
    numeroSerie: 'BA-2024-0156',
    ubicacion: 'Unidad móvil 01',
    estado: 'Operativo',
    categoria: 'Bombas',
    asignadoA: 'Unidad móvil 01',
    marca: 'Flygt',
    ultimaMantencion: new Date('2026-05-18'),
    proximaMantencion: new Date('2026-08-18'),
  },
]

async function main() {
  for (const m of MAQUINARIA) {
    const existing = await prisma.maquinaria.findFirst({ where: { codigo: m.codigo } })
    if (existing) {
      await prisma.maquinaria.update({ where: { id: existing.id }, data: m })
      console.log('updated', m.codigo)
    } else {
      await prisma.maquinaria.create({ data: m })
      console.log('created', m.codigo)
    }
  }

  const gen = await prisma.maquinaria.findFirst({ where: { codigo: 'GEN-003' } })
  const ot = await prisma.ordenTrabajo.findUnique({ where: { id: 'OT-2026-0128' } })
  if (gen && ot) {
    await prisma.utiliza.upsert({
      where: {
        idOt_idMaquinaria: { idOt: 'OT-2026-0128', idMaquinaria: gen.id },
      },
      update: { horasUso: 4, fechaUso: new Date('2026-05-22') },
      create: {
        idOt: 'OT-2026-0128',
        idMaquinaria: gen.id,
        horasUso: 4,
        fechaUso: new Date('2026-05-22'),
      },
    })
    console.log('linked GEN-003 -> OT-2026-0128')
  } else {
    console.log('skip utiliza (missing gen or OT)')
  }

  console.log('total', await prisma.maquinaria.count())
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
