import type { Product } from '@/types'

export function exportProductsToCsv(
  products: Product[],
  filename = 'inventario-camus.csv',
) {
  const headers = [
    'Código',
    'Producto',
    'Categoría',
    'Stock Actual',
    'Stock Mínimo',
    'Unidad',
    'Estado',
  ]
  const rows = products.map((p) =>
    [
      p.code,
      p.name,
      p.category,
      p.currentStock,
      p.minStock,
      p.unit,
      p.status,
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
