import type { PermissionKey } from '@/types'
import { initialRoles } from '@/data/mock/users'
import {
  isRestrictedOrderEditor,
  type OrderPermissionUser,
} from '@/features/orders/utils/canEditOrder'
import { ROUTES } from '@/constants/routes'

/** Permisos por ruta del menú */
export const ROUTE_PERMISSIONS: Record<string, PermissionKey | null> = {
  [ROUTES.DASHBOARD]: 'dashboard.view',
  [ROUTES.CLIENTES]: 'clients.manage',
  [ROUTES.ORDENES]: 'orders.manage',
  [ROUTES.INVENTARIO]: 'inventory.manage',
  [ROUTES.OPERACIONES]: 'operations.view',
  [ROUTES.FACTURACION]: 'billing.manage',
  [ROUTES.REPORTES]: 'reports.view',
  [ROUTES.USUARIOS]: 'users.manage',
  [ROUTES.PARAMETROS]: 'users.manage',
  [ROUTES.CONFIGURACION]: null,
  [ROUTES.SOPORTE]: null,
}

export function permissionsForRole(roleName?: string | null): PermissionKey[] {
  const name = (roleName ?? '').trim().toLowerCase()
  if (!name) {
    return ['dashboard.view']
  }

  const exact = initialRoles.find((r) => r.name.toLowerCase() === name)
  if (exact) return [...exact.permissions]

  if (
    name.includes('admin') ||
    name.includes('administrador')
  ) {
    return [...(initialRoles.find((r) => r.id === 'role-admin')?.permissions ?? [])]
  }

  if (
    name.includes('técnico') ||
    name.includes('tecnico') ||
    name.includes('operador') ||
    name.includes('campo')
  ) {
    return [
      ...(initialRoles.find((r) => r.id === 'role-tecnico')?.permissions ?? [
        'dashboard.view',
        'orders.manage',
        'operations.view',
      ]),
    ]
  }

  if (name.includes('supervisor') || name.includes('jefe')) {
    return [...(initialRoles.find((r) => r.id === 'role-supervisor')?.permissions ?? [])]
  }

  if (name.includes('contab')) {
    return [...(initialRoles.find((r) => r.id === 'role-contabilidad')?.permissions ?? [])]
  }

  if (name.includes('inventario')) {
    return [...(initialRoles.find((r) => r.id === 'role-inventario')?.permissions ?? [])]
  }

  return ['dashboard.view']
}

export function hasPermission(
  user: OrderPermissionUser | null | undefined,
  permission: PermissionKey | null,
): boolean {
  if (permission == null) return true
  return permissionsForRole(user?.role).includes(permission)
}

export function canAccessPath(
  user: OrderPermissionUser | null | undefined,
  path: string,
): boolean {
  const required = ROUTE_PERMISSIONS[path]
  if (required === undefined) return true
  return hasPermission(user, required)
}

export function isFieldOperator(
  user: OrderPermissionUser | null | undefined,
): boolean {
  return isRestrictedOrderEditor(user)
}
