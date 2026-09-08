import type {
  OrderModificationHistoryEntry,
  OrderModificationRequest,
} from '@/types'

/** RF68 — solicitudes seed */
export const initialModificationRequests: OrderModificationRequest[] = [
  {
    id: 'mr-1',
    orderId: 'OT-2026-0128',
    operatorId: 'u3',
    operatorName: 'Luis Torres',
    fieldsToModify: 'Dirección, Descripción del servicio',
    reason: 'El cliente indicó dirección alternativa de acceso al servicio.',
    status: 'Pendiente',
    requestedAt: '2026-05-26T11:20:00.000Z',
  },
]

/** RF68 CDS 235 — historial seed */
export const initialModificationHistory: OrderModificationHistoryEntry[] = [
  {
    id: 'mh-1',
    orderId: 'OT-2026-0128',
    field: 'priority',
    fieldLabel: 'Prioridad',
    previousValue: 'Media',
    newValue: 'Alta',
    changedById: 'u1',
    changedByName: 'Juan Pérez',
    changedAt: '2026-05-21T16:45:00.000Z',
  },
]
