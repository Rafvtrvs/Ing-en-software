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
    id: 'ra-2',
    userId: 'u4',
    userName: 'Ana Torres',
    userEmail: 'ana.torres@camus.cl',
    previousRoleId: null,
    previousRoleName: null,
    newRoleId: 'role-contabilidad',
    newRoleName: 'Contabilidad',
    performedBy: 'u1',
    performedByName: 'Juan Pérez',
    performedAt: '2026-05-18T10:15:00.000Z',
  },
  {
    id: 'ra-3',
    userId: 'u3',
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
