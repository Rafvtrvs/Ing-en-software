import type { OrderComment } from '@/types'

/** RF65 — comentarios seed por OT */
export const initialOrderComments: OrderComment[] = [
  {
    id: 'oc-1',
    orderId: 'OT-2026-0128',
    content: 'Se confirmó acceso al pozo de inspección con el cliente en sitio.',
    authorId: 'u3',
    authorName: 'Luis Torres',
    createdAt: '2026-05-22T10:30:00.000Z',
  },
  {
    id: 'oc-2',
    orderId: 'OT-2026-0128',
    content: 'Requiere camión hidrojet adicional por obstrucción severa.',
    authorId: 'u1',
    authorName: 'Juan Pérez',
    createdAt: '2026-05-23T14:15:00.000Z',
  },
]
