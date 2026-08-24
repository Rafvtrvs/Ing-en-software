import type { Client } from '@/types'

export function exportClientsToCsv(clients: Client[], filename = 'clientes-camus.csv') {
  const headers = ['Cliente', 'Empresa', 'RUT', 'Teléfono', 'Email', 'Estado', 'Última Orden']
  const rows = clients.map((c) =>
    [c.name, c.company, c.rut, c.phone, c.email, c.status, c.lastOrder]
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
