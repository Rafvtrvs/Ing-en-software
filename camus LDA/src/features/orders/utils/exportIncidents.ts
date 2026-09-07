import type { WorkOrder } from '@/types'

/** Export CSV de incidentes por OT (CU-169) */
export function exportIncidentsToCsv(
  orders: WorkOrder[],
  filename = 'incidentes-ordenes-camus.csv',
) {
  const headers = [
    'ID Orden',
    'Cliente',
    'Tipo incidente',
    'Categoría',
    'Prioridad',
    'Estado',
    'Inicio',
    'Término',
    'Duración (h)',
    'Operadores',
  ]

  const rows = orders.map((o) =>
    [
      o.id,
      o.client,
      o.incidentType ?? o.category,
      o.category,
      o.priority ?? '',
      o.status,
      o.startDate ?? '',
      o.endDate ?? '',
      o.durationHours != null ? String(o.durationHours) : '',
      o.operators?.map((op) => op.name).join('; ') || o.technician || '',
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(','),
  )

  const csv = [headers.join(','), ...rows].join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
