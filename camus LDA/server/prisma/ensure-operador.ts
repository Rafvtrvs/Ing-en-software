/**
 * Crea/actualiza la cuenta de operario sin reseed completo.
 * Ejecutar: npx tsx prisma/ensure-operador.ts
 */
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  let tecnicoRol = await prisma.rol.findFirst({
    where: { nombre: 'Técnico de Campo' },
  })
  if (!tecnicoRol) {
    tecnicoRol = await prisma.rol.create({
      data: {
        nombre: 'Técnico de Campo',
        descripcion: 'Operario de terreno: solo órdenes asignadas',
        esSistema: true,
      },
    })
  }

  const permisos = await prisma.permiso.findMany({
    where: {
      clave: { in: ['dashboard.view', 'orders.manage', 'operations.view'] },
    },
  })
  for (const p of permisos) {
    await prisma.rolPermiso.upsert({
      where: {
        idRol_idPermiso: { idRol: tecnicoRol.id, idPermiso: p.id },
      },
      update: {},
      create: { idRol: tecnicoRol.id, idPermiso: p.id },
    })
  }

  const passwordHash = await bcrypt.hash('operador123', 10)
  const user = await prisma.usuario.upsert({
    where: { correoElectronico: 'operador@camus.cl' },
    update: {
      nombre: 'Luis Torres',
      passwordHash,
      idRol: tecnicoRol.id,
      estado: 'Activo',
      telefono: '+56 9 6543 2109',
    },
    create: {
      nombre: 'Luis Torres',
      correoElectronico: 'operador@camus.cl',
      passwordHash,
      idRol: tecnicoRol.id,
      estado: 'Activo',
      telefono: '+56 9 6543 2109',
    },
    include: { rol: true },
  })

  console.log('[ensure-operador] OK')
  console.log(`  Usuario: ${user.correoElectronico}`)
  console.log(`  Nombre:  ${user.nombre}`)
  console.log(`  Rol:     ${user.rol?.nombre}`)
  console.log('  Clave:   operador123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
