import type { OrderRescheduleEvent } from '@/types'

/** RF66 CDS 229 — historial seed de reprogramaciones */
export const initialRescheduleHistory: OrderRescheduleEvent[] = [
  {
    id: 'rs-1',
    orderId: 'OT-2026-0128',
    previousDate: '2026-05-25',
    newDate: '2026-05-28',
    changedById: 'u1',
    changedByName: 'Juan Pérez',
    changedAt: '2026-05-24T09:00:00.000Z',
  },
]
