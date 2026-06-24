import type { AppNotification } from '@/types'

export const initialNotifications: AppNotification[] = [
  {
    id: 'notif-1',
    title: 'Bienvenido al sistema',
    message: 'Las alertas de órdenes y operaciones aparecerán aquí en tiempo real.',
    type: 'system',
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: 'notif-2',
    title: 'Recordatorio de inventario',
    message: 'Hay 3 productos con stock bajo. Revisa el módulo de inventario.',
    type: 'inventory',
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    link: '/inventario',
  },
]
