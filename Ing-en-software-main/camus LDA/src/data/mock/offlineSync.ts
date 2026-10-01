import type { OfflineSyncEntry } from '@/types'

export const initialOfflineSyncEntries: OfflineSyncEntry[] = [
  {
    id: 'off-1',
    module: 'Órdenes',
    summary: 'Registro borrador OT terreno — Av. Los Leones',
    status: 'sincronizado',
    createdAt: '2026-05-20T09:15:00',
    syncedAt: '2026-05-20T09:22:00',
  },
  {
    id: 'off-2',
    module: 'Intervenciones',
    summary: 'Intervención desobstrucción ducto (operador Luis Torres)',
    status: 'pendiente',
    createdAt: '2026-05-22T11:40:00',
  },
]
