import type { WorkOrder } from '@/types'

export interface OrderPermissionUser {
  id?: string
  name?: string
  role?: string
  email?: string
}

const FULL_ACCESS_ROLE_HINTS = [
  'admin',
  'administrador',
  'supervisor',
  'gerente',
]

const RESTRICTED_ROLE_HINTS = [
  'tecnico',
  'técnico',
  'operador',
  'campo',
]

function normalizeRole(role?: string): string {
  return (role ?? '').trim().toLowerCase()
}

/** Roles con acceso total a editar cualquier OT */
export function hasFullOrderAccess(user?: OrderPermissionUser | null): boolean {
  const role = normalizeRole(user?.role)
  if (!role) return false
  return FULL_ACCESS_ROLE_HINTS.some((h) => role.includes(h))
}

/** Técnico / operador: solo OT asignadas (CU-183–187) */
export function isRestrictedOrderEditor(
  user?: OrderPermissionUser | null,
): boolean {
  const role = normalizeRole(user?.role)
  if (!role) return false
  if (hasFullOrderAccess(user)) return false
  return RESTRICTED_ROLE_HINTS.some((h) => role.includes(h))
}

/** ¿El usuario está asignado a la OT (técnico o cuadrilla)? */
export function isAssignedToOrder(
  user: OrderPermissionUser | null | undefined,
  order: WorkOrder,
): boolean {
  if (!user) return false
  const ids = order.operatorIds ?? []
  if (user.id && ids.includes(user.id)) return true

  const name = (user.name ?? '').trim().toLowerCase()
  const email = (user.email ?? '').trim().toLowerCase()

  if (name) {
    if (order.technician?.trim().toLowerCase() === name) return true
    if (
      order.operators?.some(
        (o) =>
          o.name.trim().toLowerCase() === name ||
          o.id === user.id,
      )
    ) {
      return true
    }
  }

  // Fallback: usuario mock Luis Torres (u3) ↔ login operador@camus.cl
  if (email === 'operador@camus.cl' || name === 'luis torres') {
    if (ids.includes('u3')) return true
    if (order.technician?.toLowerCase().includes('luis torres')) return true
    if (order.operators?.some((o) => o.id === 'u3' || o.name.toLowerCase().includes('luis'))) {
      return true
    }
  }

  return false
}

/**
 * CU-183–187: operador/técnico solo edita OT asignadas (incl. cuadrilla);
 * admin/supervisor editan todas; tras reasignación pierde permiso.
 */
export function canEditOrder(
  user: OrderPermissionUser | null | undefined,
  order: WorkOrder,
): boolean {
  if (!user) return false
  if (hasFullOrderAccess(user)) return true
  if (isRestrictedOrderEditor(user)) {
    return isAssignedToOrder(user, order)
  }
  // Otros roles con acceso al módulo: permitir (p. ej. supervisor ya cubierto)
  return true
}

/** Lista OT asignadas al usuario. Roles restringidos: SOLO las suyas. */
export function listAssignedOrders(
  orders: WorkOrder[],
  user: OrderPermissionUser | null | undefined,
): WorkOrder[] {
  if (!user) return []
  // Admin/supervisor ven todas; técnico/operador solo las asignadas
  if (hasFullOrderAccess(user) && !isRestrictedOrderEditor(user)) {
    return orders
  }
  if (isRestrictedOrderEditor(user)) {
    return orders.filter((o) => isAssignedToOrder(user, o))
  }
  if (hasFullOrderAccess(user)) return orders
  return orders.filter((o) => isAssignedToOrder(user, o))
}

/** Mensaje de bloqueo cuando intenta editar OT ajena (CU-184) */
export function orderEditBlockedMessage(order: WorkOrder): string {
  return `No puedes editar la orden ${order.id}: no está asignada a ti.`
}
