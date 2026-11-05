import api from './api'
import type { AuditLogEntry } from '@/data/mock/audit'

export interface ApiAuditLogRow {
  id: string
  moduloAfectado: string | null
  accion: string | null
  valorAnterior: string | null
  valorNuevo: string | null
  idUsuario: number | null
  usuarioNombre?: string | null
  usuarioEmail?: string | null
  orderId?: string | null
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
    'ordenes|cambio_estado': 'Órdenes › Tablero Kanban / Terreno',
    'ordenes|actualización estado': 'Órdenes › Tablero Kanban',
    'ordenes|asignar_operador': 'Órdenes › Asignación de operario',
    'ordenes|comentario': 'Órdenes › Comentarios',
    'ordenes|creación': 'Órdenes › Formulario nueva orden',
    'ordenes|crear': 'Órdenes › Formulario nueva orden',
    'ordenes|actualizar': 'Órdenes › Edición / Kanban',
    'ordenes|eliminar': 'Órdenes › Listado de órdenes',
    'ordenes|reprogramar': 'Órdenes › Reprogramación',
    'intervenciones|crear': 'Órdenes › Intervenciones',
    'intervenciones|actualizar': 'Órdenes › Intervenciones',
    'evidencia|cargar_imagen': 'Terreno › Evidencia fotográfica',
    'evidencia|eliminar_imagen': 'Terreno › Evidencia fotográfica',
    'documentos|cargar': 'Órdenes › Documentos PDF',
    'documentos|nueva_version': 'Órdenes › Documentos PDF',
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
    intervenciones: 'Intervenciones',
    evidencia: 'Evidencia',
    documentos: 'Documentos',
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
  const usuario =
    row.usuarioNombre?.trim() ||
    (row.idUsuario != null ? `Usuario #${row.idUsuario}` : 'Sistema')
  return {
    id: row.id,
    moduloAfectado: modulo,
    accion,
    valorAnterior: row.valorAnterior,
    valorNuevo: row.valorNuevo,
    usuario,
    idUsuario: row.idUsuario ?? null,
    orderId: row.orderId ?? null,
    fechaHora: row.fechaHora,
    ubicacion: inferUbicacion(modulo, accion),
  }
}

export const reportsService = {
  async fetchAuditLogs(params?: {
    orderId?: string
    userId?: string | number
    from?: string
    to?: string
  }): Promise<AuditLogEntry[]> {
    try {
      const { data } = await api.get<ApiAuditLogRow[]>('/reports/audit', {
        params: {
          orderId: params?.orderId || undefined,
          userId: params?.userId || undefined,
          from: params?.from || undefined,
          to: params?.to || undefined,
          limit: 2000,
        },
      })
      if (Array.isArray(data)) {
        return data.map(mapApiRow)
      }
    } catch {
      // Sin backend: lista vacía (no reinyectar mocks de demostración)
    }
    return []
  },
}
