import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const rows = await prisma.maquinaria.findMany({
    where: { ubicacion: { startsWith: 'OT OT-' } },
  })
  for (const r of rows) {
    const next = r.ubicacion.replace(/^OT\s+(OT-)/i, '$1')
    await prisma.maquinaria.update({
      where: { id: r.id },
      data: { ubicacion: next },
    })
    console.log(r.codigo, '->', next)
  }
  console.log('fixed', rows.length)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
