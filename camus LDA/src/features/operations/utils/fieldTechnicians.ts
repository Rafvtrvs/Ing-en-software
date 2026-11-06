import type {
  AppRole,
  FieldOperationStatus,
  FieldTechnician,
  OrderOperator,
  SystemUser,
  WorkOrder,
} from '@/types'

function normalizeRoleName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

/** Roles de terreno: técnico / operador / campo / operario. */
export function isFieldTechRoleName(name?: string | null): boolean {
  if (!name) return false
  const n = normalizeRoleName(name)
  return (
    n.includes('tecnico') ||
    n.includes('operador') ||
    n.includes('operario') ||
    n.includes('campo')
  )
}

type UserWithRole = SystemUser & { roleName?: string }

/**
 * Técnicos/operadores activos desde usuarios del sistema (Postgres / Firebase).
 */
export function getActiveFieldOperators(
  users: UserWithRole[],
  roles: AppRole[],
): OrderOperator[] {
  const techRoleIds = new Set(
    roles.filter((r) => isFieldTechRoleName(r.name)).map((r) => r.id),
  )

  return users
    .filter((u) => {
      if (u.status !== 'Activo') return false
      if (techRoleIds.has(u.roleId)) return true
      if (isFieldTechRoleName(u.roleName)) return true
      const role = roles.find((r) => r.id === u.roleId)
      return isFieldTechRoleName(role?.name)
    })
    .map((u) => ({ id: u.id, name: u.name }))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'))
}

function sameId(a?: string | number | null, b?: string | number | null): boolean {
  if (a == null || b == null) return false
  const sa = String(a).trim()
  const sb = String(b).trim()
  if (!sa || !sb) return false
  if (sa === sb) return true
  const na = Number(sa)
  const nb = Number(sb)
  return Number.isFinite(na) && Number.isFinite(nb) && na === nb
}

/** La OT cuenta para el técnico solo si está en la cuadrilla, o por nombre si no hay ids. */
export function isOrderAssignedTo(
  order: WorkOrder,
  operatorId: string,
  operatorName?: string,
): boolean {
  const ids = [
    ...(order.operatorIds ?? []),
    ...(order.operators ?? []).map((op) => op.id),
  ].filter(Boolean)
  if (ids.length > 0) return ids.some((id) => sameId(id, operatorId))
  const name = (operatorName ?? '').trim().toLowerCase()
  const tech = (order.technician ?? '').trim().toLowerCase()
  return Boolean(name && tech && name === tech)
}

function ordersForOperator(orders: WorkOrder[], op: OrderOperator): WorkOrder[] {
  return orders.filter((order) => isOrderAssignedTo(order, op.id, op.name))
}

function mapOrderStatusToField(status: string): FieldOperationStatus {
  switch (status) {
    case 'En Curso':
      return 'En Curso'
    case 'Completada':
      return 'Completada'
    case 'Pendiente':
      return 'En Espera'
    case 'Cancelada':
      return 'En Espera'
    default:
      return 'En Ruta'
  }
}

/**
 * Lista “Técnicos en terreno” derivada de usuarios reales + OT asignadas.
 */
export function buildFieldTechniciansFromSystem(
  users: UserWithRole[],
  roles: AppRole[],
  orders: WorkOrder[],
): FieldTechnician[] {
  const operators = getActiveFieldOperators(users, roles)

  return operators.map((op) => {
    const assigned = ordersForOperator(orders, op)
    const current =
      assigned.find((o) => o.status === 'En Curso') ??
      assigned.find(
        (o) => o.status !== 'Completada' && o.status !== 'Cancelada',
      ) ??
      assigned[0]

    if (!current) {
      return {
        id: op.id,
        name: op.name,
        status: 'En Espera' as FieldOperationStatus,
        address: 'Sin orden activa',
        orderId: '—',
        progress: 0,
      }
    }

    return {
      id: op.id,
      name: op.name,
      status: mapOrderStatusToField(current.status),
      address: current.address || 'Sin dirección',
      orderId: current.id,
      progress: current.progress ?? 0,
    }
  })
}
