import type { UserLifecycleEvent } from '@/types'

export const initialUserLifecycleEvents: UserLifecycleEvent[] = [
  {
    id: 'ule-1',
    userId: 'user-old-1',
    userName: 'Pedro Soto',
    userEmail: 'pedro.soto@camus.cl',
    action: 'desactivado',
    performedBy: 'user-admin',
    performedByName: 'Admin Sistema',
    performedAt: '2026-01-15T10:30:00',
    reason: 'Licencia médica prolongada',
  },
  {
    id: 'ule-2',
    userId: 'user-old-2',
    userName: 'María Vega',
    userEmail: 'maria.vega@camus.cl',
    action: 'eliminado',
    performedBy: 'user-admin',
    performedByName: 'Admin Sistema',
    performedAt: '2026-02-01T14:00:00',
    reason: 'Renuncia voluntaria',
  },
]
