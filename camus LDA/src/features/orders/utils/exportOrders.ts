import type { WorkOrder } from '@/types'

export function exportOrdersToCsv(
  orders: WorkOrder[],
  filename = 'ordenes-trabajo-camus.csv',
) {
  const headers = [
    'ID Orden',
    'Cliente',
    'Dirección',
    'Servicio',
    'Categoría',
    'Incidente',
    'Estado',
    'Prioridad',
    'Técnico',
    'Progreso',
    'Inicio',
    'Término',
    'Duración (h)',
    'Fecha Creación',
  ]

  const rows = orders.map((o) =>
    [
      o.id,
      o.client,
      o.address,
      o.service ?? '',
      o.category,
      o.incidentType ?? '',
      o.status,
      o.priority ?? '',
      o.technician ?? '',
      String(o.progress ?? ''),
      o.startDate ?? '',
      o.endDate ?? '',
      o.durationHours != null ? String(o.durationHours) : '',
      o.createdAt,
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

