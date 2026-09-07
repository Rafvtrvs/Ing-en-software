// ============================================================
//  Seed: carga en PostgreSQL los datos de demostración que el
//  frontend tenía en src/data/mock. Así la migración a BD conserva
//  la funcionalidad y los datos visibles actuales.
//
//  Ejecutar:  npm run seed
// ============================================================
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const PERMISOS = [
  { clave: 'dashboard.view', etiqueta: 'Ver dashboard', modulo: 'Dashboard' },
  { clave: 'clients.manage', etiqueta: 'Gestionar clientes', modulo: 'Clientes' },
  { clave: 'orders.manage', etiqueta: 'Gestionar órdenes', modulo: 'Órdenes' },
  { clave: 'inventory.manage', etiqueta: 'Gestionar inventario', modulo: 'Inventario' },
  { clave: 'operations.view', etiqueta: 'Ver operaciones', modulo: 'Operaciones' },
  { clave: 'billing.manage', etiqueta: 'Gestionar facturación', modulo: 'Facturación' },
  { clave: 'reports.view', etiqueta: 'Ver reportes', modulo: 'Reportes' },
  { clave: 'users.manage', etiqueta: 'Gestionar usuarios', modulo: 'Usuarios' },
]

const CLIENTES = [
  { rut: '76.123.456-7', nombre: 'Carlos Mendoza', empresa: 'Comercial XYZ Ltda.', telefono: '+56 9 8765 4321', email: 'carlos@xyz.cl', estado: 'Activo', ultimaOrden: '22/05/2026' },
  { rut: '77.234.567-8', nombre: 'María González', empresa: 'Inversiones SpA', telefono: '+56 9 7654 3210', email: 'maria@inversiones.cl', estado: 'Activo', ultimaOrden: '21/05/2026' },
  { rut: '78.345.678-9', nombre: 'Roberto Silva', empresa: 'Constructora ABC', telefono: '+56 9 6543 2109', email: 'roberto@abc.cl', estado: 'Inactivo', ultimaOrden: '15/04/2026' },
  { rut: '79.456.789-0', nombre: 'Ana Torres', empresa: 'Aguas Claras Ltda.', telefono: '+56 9 5432 1098', email: 'ana@aguasclaras.cl', estado: 'Activo', ultimaOrden: '20/05/2026' },
  { rut: '80.567.890-1', nombre: 'Pedro Rojas', empresa: 'Edificio Central', telefono: '+56 9 4321 0987', email: 'pedro@edificio.cl', estado: 'Pendiente', ultimaOrden: '' },
  { rut: '81.678.901-2', nombre: 'Laura Soto', empresa: 'Servicios Urbanos SA', telefono: '+56 9 3210 9876', email: 'laura@urbanos.cl', estado: 'Activo', ultimaOrden: '19/05/2026' },
  { rut: '82.789.012-3', nombre: 'Miguel Álvarez', empresa: 'Industrias del Sur', telefono: '+56 9 2109 8765', email: 'miguel@idsur.cl', estado: 'Bloqueado', ultimaOrden: '10/03/2026' },
  { rut: '83.890.123-4', nombre: 'Daniela Pérez', empresa: 'Condominio Las Flores', telefono: '+56 9 1098 7654', email: 'daniela@lasflores.cl', estado: 'Activo', ultimaOrden: '18/05/2026' },
]

const ORDENES = [
  { id: 'OT-2026-0128', empresa: 'Comercial XYZ Ltda.', direccion: 'Av. Las Torres 1234', servicio: 'Obstrucción de cámara', categoria: 'Obstrucción', estado: 'Pendiente', prioridad: 'Alta', progreso: 0 },
  { id: 'OT-2026-0127', empresa: 'Inversiones SpA', direccion: 'Camino a Melipilla 456', servicio: 'Rotura de tubería matriz', categoria: 'Rotura de Tubería', estado: 'En Curso', prioridad: 'Media', progreso: 60 },
  { id: 'OT-2026-0126', empresa: 'Comercial XYZ Ltda.', direccion: 'Pte. Salvador 789', servicio: 'Mantención preventiva', categoria: 'Mantención', estado: 'Completada', prioridad: 'Baja', progreso: 100 },
  { id: 'OT-2026-0124', empresa: 'Constructora ABC', direccion: 'Av. Libertad 123', servicio: 'Desobstrucción de ducto', categoria: 'Obstrucción', estado: 'En Curso', prioridad: 'Alta', progreso: 35 },
]

const INSUMOS = [
  { codigo: 'INS-001', nombre: 'Tubería PVC 110mm', stockActual: 8, stockMinimo: 20, unidad: 'm', estado: 'Crítico' },
  { codigo: 'INS-002', nombre: 'Codo PVC 90°', stockActual: 45, stockMinimo: 30, unidad: 'unidad', estado: 'Ok' },
  { codigo: 'INS-003', nombre: 'Sello hidráulico', stockActual: 18, stockMinimo: 15, unidad: 'unidad', estado: 'Bajo' },
]

async function main() {
  console.log('[seed] iniciando...')

  // Permisos
  for (const p of PERMISOS) {
    await prisma.permiso.upsert({
      where: { clave: p.clave },
      update: {},
      create: p,
    })
  }

  // Rol Administrador con todos los permisos
  const permisos = await prisma.permiso.findMany()
  const adminRol = await prisma.rol.create({
    data: {
      nombre: 'Administrador',
      descripcion: 'Acceso total al sistema',
      esSistema: true,
      permisos: { create: permisos.map((p) => ({ idPermiso: p.id })) },
    },
  })

  // Usuario administrador (login local: admin@camus.cl / admin123)
  await prisma.usuario.create({
    data: {
      nombre: 'Administrador',
      correoElectronico: 'admin@camus.cl',
      passwordHash: await bcrypt.hash('admin123', 10),
      idRol: adminRol.id,
      estado: 'Activo',
    },
  })

  // Clientes
  const clientesCreados = await Promise.all(
    CLIENTES.map((c) => prisma.cliente.create({ data: c })),
  )
  const clientePorEmpresa = new Map(
    clientesCreados.map((c) => [c.empresa, c.id]),
  )

  // Insumos
  await Promise.all(INSUMOS.map((i) => prisma.insumo.create({ data: i })))

  // Órdenes (vinculadas al cliente por nombre de empresa)
  let visual = 0
  for (const o of ORDENES) {
    await prisma.ordenTrabajo.create({
      data: {
        id: o.id,
        direccion: o.direccion,
        servicio: o.servicio,
        categoria: o.categoria,
        estado: o.estado,
        prioridad: o.prioridad,
        progreso: o.progreso,
        ordenVisual: visual++,
        idCliente: clientePorEmpresa.get(o.empresa) ?? null,
      },
    })
  }

  console.log('[seed] completado. Usuario: admin@camus.cl / admin123')
}

main()
  .catch((e) => {
    console.error('[seed] error', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
