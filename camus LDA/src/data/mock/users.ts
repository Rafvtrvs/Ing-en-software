import { Shield, UserCheck, UserCog, Users } from 'lucide-react'
import type { AppRole, KpiData, Permission, PermissionKey, SystemUser } from '@/types'

export const ALL_PERMISSIONS: Permission[] = [
  { key: 'dashboard.view', label: 'Ver dashboard', module: 'Dashboard' },
  { key: 'clients.manage', label: 'Gestionar clientes', module: 'Clientes' },
  { key: 'orders.manage', label: 'Gestionar órdenes', module: 'Órdenes' },
  { key: 'inventory.manage', label: 'Gestionar inventario', module: 'Inventario' },
  { key: 'operations.view', label: 'Ver operaciones en terreno', module: 'Operaciones' },
  { key: 'billing.manage', label: 'Gestionar facturación', module: 'Facturación' },
  { key: 'reports.view', label: 'Ver reportes', module: 'Reportes' },
  { key: 'users.manage', label: 'Administrar usuarios y roles', module: 'Usuarios' },
]

const ALL_KEYS = ALL_PERMISSIONS.map((p) => p.key)

export const initialRoles: AppRole[] = [
  {
    id: 'role-admin',
    name: 'Administrador',
    description: 'Acceso completo a todos los módulos del sistema.',
    permissions: [...ALL_KEYS],
    status: 'Activo',
    isSystem: true,
  },
  {
    id: 'role-supervisor',
    name: 'Supervisor',
    description: 'Supervisión operativa, reportes y gestión de equipos.',
    permissions: [
      'dashboard.view',
      'clients.manage',
      'orders.manage',
      'inventory.manage',
      'operations.view',
      'billing.manage',
      'reports.view',
    ],
    status: 'Activo',
    isSystem: true,
  },
  {
    id: 'role-tecnico',
    name: 'Técnico de Campo',
    description: 'Acceso a órdenes asignadas y operaciones en terreno.',
    permissions: ['dashboard.view', 'orders.manage', 'operations.view'],
    status: 'Activo',
    isSystem: true,
  },
  {
    id: 'role-contabilidad',
    name: 'Contabilidad',
    description: 'Facturación, cobranza y reportes financieros.',
    permissions: ['dashboard.view', 'clients.manage', 'billing.manage', 'reports.view'],
    status: 'Activo',
  },
  {
    id: 'role-inventario',
    name: 'Encargado de Inventario',
    description: 'Control de stock, movimientos y kits.',
    permissions: ['dashboard.view', 'inventory.manage', 'reports.view'],
    status: 'Activo',
  },
]

export const initialSystemUsers: SystemUser[] = [
  {
    id: 'u1',
    name: 'Juan Pérez',
    email: 'juan.perez@camus.cl',
    phone: '+56 9 8765 4321',
    roleId: 'role-admin',
    status: 'Activo',
    lastLogin: '2026-05-25T09:30:00',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Juan',
  },
  {
    id: 'u2',
    name: 'María González',
    email: 'maria.gonzalez@camus.cl',
    phone: '+56 9 7654 3210',
    roleId: 'role-supervisor',
    status: 'Activo',
    lastLogin: '2026-05-25T08:15:00',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria',
  },
  {
    id: 'u3',
    name: 'Luis Torres',
    email: 'luis.torres@camus.cl',
    phone: '+56 9 6543 2109',
    roleId: 'role-tecnico',
    status: 'Activo',
    lastLogin: '2026-05-24T17:45:00',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Luis',
  },
  {
    id: 'u4',
    name: 'Ana Pérez',
    email: 'ana.perez@camus.cl',
    phone: '+56 9 5432 1098',
    roleId: 'role-tecnico',
    status: 'Activo',
    lastLogin: '2026-05-24T16:20:00',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ana',
  },
  {
    id: 'u5',
    name: 'Carlos Mendoza',
    email: 'carlos.mendoza@camus.cl',
    phone: '+56 9 4321 0987',
    roleId: 'role-contabilidad',
    status: 'Activo',
    lastLogin: '2026-05-23T11:00:00',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos',
  },
  {
    id: 'u6',
    name: 'Patricia Muñoz',
    email: 'patricia.munoz@camus.cl',
    phone: '+56 9 3210 9876',
    roleId: 'role-inventario',
    status: 'Inactivo',
    lastLogin: '2026-05-10T14:30:00',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Patricia',
  },
]

export function getUsersKpis(users: SystemUser[], roles: AppRole[]): KpiData[] {
  const active = users.filter((u) => u.status === 'Activo').length
  const inactive = users.filter((u) => u.status !== 'Activo').length
  const activeRoles = roles.filter((r) => r.status === 'Activo').length

  return [
    {
      title: 'Usuarios Totales',
      value: String(users.length),
      trend: `${active} activos`,
      trendDirection: 'up',
      icon: Users,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Usuarios Activos',
      value: String(active),
      trend: `${inactive} inactivos o bloqueados`,
      trendDirection: 'up',
      icon: UserCheck,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
    },
    {
      title: 'Roles Configurados',
      value: String(roles.length),
      trend: `${activeRoles} activos`,
      trendDirection: 'up',
      icon: UserCog,
      iconBg: 'bg-violet-50',
      iconColor: 'text-violet-600',
    },
    {
      title: 'Roles de Sistema',
      value: String(roles.filter((r) => r.isSystem).length),
      trend: 'No eliminables',
      trendDirection: 'up',
      icon: Shield,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
    },
  ]
}

export function getPermissionLabel(key: PermissionKey): string {
  return ALL_PERMISSIONS.find((p) => p.key === key)?.label ?? key
}

export function getRoleName(roles: AppRole[], roleId: string): string {
  return roles.find((r) => r.id === roleId)?.name ?? 'Sin rol'
}

export function countUsersByRole(users: SystemUser[], roleId: string): number {
  return users.filter((u) => u.roleId === roleId).length
}
