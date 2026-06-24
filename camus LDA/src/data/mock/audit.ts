export interface AuditLogEntry {
  id: string
  moduloAfectado: string
  accion: string
  valorAnterior: string | null
  valorNuevo: string | null
  usuario: string
  fechaHora: string
  /** Pantalla o sección donde se registró el cambio */
  ubicacion: string
}

export const mockAuditLogs: AuditLogEntry[] = [
  {
    id: 'aud-001',
    moduloAfectado: 'Autenticación',
    accion: 'Inicio de sesión',
    valorAnterior: null,
    valorNuevo: 'admin@camus.cl',
    usuario: 'Administrador',
    fechaHora: '2026-06-16T09:15:00',
    ubicacion: 'Pantalla de inicio de sesión',
  },
  {
    id: 'aud-002',
    moduloAfectado: 'Clientes',
    accion: 'Creación',
    valorAnterior: null,
    valorNuevo: 'Comercial XYZ Ltda. (76.543.210-1)',
    usuario: 'Administrador',
    fechaHora: '2026-06-16T09:22:00',
    ubicacion: 'Clientes › Formulario nuevo cliente',
  },
  {
    id: 'aud-003',
    moduloAfectado: 'Órdenes',
    accion: 'Actualización estado',
    valorAnterior: 'Pendiente',
    valorNuevo: 'En Curso',
    usuario: 'María González',
    fechaHora: '2026-06-16T10:05:00',
    ubicacion: 'Órdenes › Tablero Kanban',
  },
  {
    id: 'aud-004',
    moduloAfectado: 'Inventario',
    accion: 'Ajuste de stock',
    valorAnterior: '12 un',
    valorNuevo: '18 un',
    usuario: 'Carlos Ruiz',
    fechaHora: '2026-06-16T10:30:00',
    ubicacion: 'Inventario › Detalle de producto',
  },
  {
    id: 'aud-005',
    moduloAfectado: 'Facturación',
    accion: 'Emisión factura',
    valorAnterior: null,
    valorNuevo: 'F-2026-0042 — $1.850.000',
    usuario: 'Administrador',
    fechaHora: '2026-06-16T11:00:00',
    ubicacion: 'Facturación › Nueva factura',
  },
  {
    id: 'aud-006',
    moduloAfectado: 'Facturación',
    accion: 'Registro de pago',
    valorAnterior: 'Emitida',
    valorNuevo: 'Pagada (Transferencia)',
    usuario: 'Administrador',
    fechaHora: '2026-06-16T11:45:00',
    ubicacion: 'Facturación › Modal registrar pago',
  },
  {
    id: 'aud-007',
    moduloAfectado: 'Usuarios',
    accion: 'Modificación rol',
    valorAnterior: 'Técnico',
    valorNuevo: 'Supervisor',
    usuario: 'Administrador',
    fechaHora: '2026-06-15T16:20:00',
    ubicacion: 'Usuarios › Edición de usuario',
  },
  {
    id: 'aud-008',
    moduloAfectado: 'Configuración',
    accion: 'Cambio apariencia',
    valorAnterior: 'Tema claro',
    valorNuevo: 'Tema oscuro',
    usuario: 'María González',
    fechaHora: '2026-06-15T14:10:00',
    ubicacion: 'Configuración › Apariencia',
  },
  {
    id: 'aud-009',
    moduloAfectado: 'Órdenes',
    accion: 'Creación',
    valorAnterior: null,
    valorNuevo: 'OT-2026-0128 — Obstrucción',
    usuario: 'María González',
    fechaHora: '2026-06-15T11:30:00',
    ubicacion: 'Órdenes › Formulario nueva orden',
  },
  {
    id: 'aud-010',
    moduloAfectado: 'Autenticación',
    accion: 'Cierre de sesión',
    valorAnterior: 'admin@camus.cl',
    valorNuevo: null,
    usuario: 'Administrador',
    fechaHora: '2026-06-14T18:00:00',
    ubicacion: 'Barra superior › Cerrar sesión',
  },
]
