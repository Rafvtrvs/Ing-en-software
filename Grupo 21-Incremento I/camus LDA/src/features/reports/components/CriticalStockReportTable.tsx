import { Card, CardHeader } from '@/components/ui/Card'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Badge } from '@/components/ui/Badge'
import type { Product } from '@/types'

interface CriticalStockReportTableProps {
  products: Product[]
}

export function CriticalStockReportTable({ products }: CriticalStockReportTableProps) {
  const critical = products.filter((p) => p.status === 'Crítico' || p.status === 'Bajo')

  const columns: Column<Product>[] = [
    { key: 'code', header: 'Código' },
    {
      key: 'name',
      header: 'Producto',
      render: (row) => <span className="font-medium text-slate-900">{row.name}</span>,
    },
    { key: 'category', header: 'Categoría' },
    {
      key: 'currentStock',
      header: 'Stock',
      render: (row) => `${row.currentStock} ${row.unit}`,
    },
    {
      key: 'minStock',
      header: 'Mínimo',
      render: (row) => `${row.minStock} ${row.unit}`,
    },
    {
      key: 'status',
      header: 'Estado',
      render: (row) => <Badge label={row.status} />,
    },
  ]

  return (
    <Card>
      <CardHeader title="Productos con Stock Bajo o Crítico" />
      {critical.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">
          No hay alertas de inventario en este momento.
        </p>
      ) : (
        <DataTable columns={columns} data={critical} keyExtractor={(row) => row.id} />
      )}
    </Card>
  )
}
