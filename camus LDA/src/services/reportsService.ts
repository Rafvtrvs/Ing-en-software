import api from './api'
import { mockAuditLogs, type AuditLogEntry } from '@/data/mock/audit'

export interface ApiAuditLogRow {
  id: string
  moduloAfectado: string | null
  accion: string | null
  valorAnterior: string | null
  valorNuevo: string | null
  idUsuario: number | null
  fechaHora: string
}

function inferUbicacion(modulo: string, accion: string): string {
  const key = `${modulo}|${accion}`.toLowerCase()
  const map: Record<string, string> = {
    'auth|login': 'Pantalla de inicio de sesión',
    'auth|logout': 'Barra superior › Cerrar sesión',
    'autenticación|inicio de sesión': 'Pantalla de inicio de sesión',
    'autenticación|cierre de sesión': 'Barra superior › Cerrar sesión',
    'clientes|creación': 'Clientes › Formulario nuevo cliente',
    'clientes|crear': 'Clientes › Formulario nuevo cliente',
    'clientes|actualizar': 'Clientes › Formulario edición cliente',
    'clientes|eliminar': 'Clientes › Listado de clientes',
    'ordenes|actualización estado': 'Órdenes › Tablero Kanban',
    'ordenes|creación': 'Órdenes › Formulario nueva orden',
    'ordenes|crear': 'Órdenes › Formulario nueva orden',
    'ordenes|actualizar': 'Órdenes › Formulario edición orden',
    'ordenes|eliminar': 'Órdenes › Listado de órdenes',
    'inventario|ajuste de stock': 'Inventario › Detalle de producto',
    'inventario|crear': 'Inventario › Nuevo producto',
    'inventario|actualizar': 'Inventario › Edición de producto',
    'inventario|eliminar': 'Inventario › Listado de productos',
    'facturación|emisión factura': 'Facturación › Nueva factura',
    'facturación|registro de pago': 'Facturación › Modal registrar pago',
    'usuarios|modificación rol': 'Usuarios › Edición de usuario',
    'configuración|cambio apariencia': 'Configuración › Apariencia',
  }

  if (map[key]) return map[key]

  const moduleLabels: Record<string, string> = {
    auth: 'Autenticación',
    clientes: 'Clientes',
    ordenes: 'Órdenes',
    inventario: 'Inventario',
    facturacion: 'Facturación',
    usuarios: 'Usuarios',
    configuracion: 'Configuración',
  }

  const label = moduleLabels[modulo.toLowerCase()] ?? modulo
  return `${label} › ${accion}`
}

function mapApiRow(row: ApiAuditLogRow): AuditLogEntry {
  const modulo = row.moduloAfectado ?? 'General'
  const accion = row.accion ?? 'Acción'
  return {
    id: row.id,
    moduloAfectado: modulo,
    accion,
    valorAnterior: row.valorAnterior,
    valorNuevo: row.valorNuevo,
    usuario: row.idUsuario ? `Usuario #${row.idUsuario}` : 'Sistema',
    fechaHora: row.fechaHora,
    ubicacion: inferUbicacion(modulo, accion),
  }
}

export const reportsService = {
  async fetchAuditLogs(): Promise<AuditLogEntry[]> {
    try {
      const { data } = await api.get<ApiAuditLogRow[]>('/reports/audit')
      if (Array.isArray(data) && data.length > 0) {
        return data.map(mapApiRow)
      }
    } catch {
      // Backend no disponible: se usa mock para demo y capturas.
    }
    return mockAuditLogs
  },
}
