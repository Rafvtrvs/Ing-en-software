import type { RoleAssignmentEvent } from '@/types'

/** RF65 CDS 226 — historial seed de asignaciones de rol */
export const initialRoleAssignmentEvents: RoleAssignmentEvent[] = [
  {
    id: 'ra-1',
    userId: 'u2',
    userName: 'María González',
    userEmail: 'maria.gonzalez@camus.cl',
    previousRoleId: 'role-tecnico',
    previousRoleName: 'Técnico de Campo',
    newRoleId: 'role-supervisor',
    newRoleName: 'Supervisor',
    performedBy: 'u1',
    performedByName: 'Juan Pérez',
    performedAt: '2026-05-20T14:30:00.000Z',
  },
  {
    id: 'ra-3',
    userId: 'u5',
    userName: 'Carlos Mendoza',
    userEmail: 'carlos.mendoza@camus.cl',
    previousRoleId: 'role-inventario',
    previousRoleName: 'Encargado de Inventario',
    newRoleId: 'role-tecnico',
    newRoleName: 'Técnico de Campo',
    performedBy: 'u1',
    performedByName: 'Juan Pérez',
    performedAt: '2026-05-10T16:45:00.000Z',
  },
]
