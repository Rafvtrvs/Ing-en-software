import { Card, CardHeader } from '@/components/ui/Card'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Badge } from '@/components/ui/Badge'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import type { InventoryItem, Product } from '@/types'
import { ROUTES } from '@/constants/routes'

const columns: Column<InventoryItem>[] = [
  { key: 'product', header: 'Producto', className: 'font-medium text-slate-900' },
  { key: 'currentStock', header: 'Stock Actual' },
  { key: 'minStock', header: 'Stock Mínimo' },
  {
    key: 'status',
    header: 'Estado',
    render: (row) => <Badge label={row.status} />,
  },
]

interface CriticalInventoryTableProps {
  products: Product[]
}

export function CriticalInventoryTable({ products }: CriticalInventoryTableProps) {
  const critical: InventoryItem[] = products
    .filter((p) => p.status === 'Crítico' || p.status === 'Bajo')
    .slice(0, 6)
    .map((p) => ({
      product: p.name,
      currentStock: p.currentStock,
      minStock: p.minStock,
      status: p.status,
    }))

  return (
    <Card>
      <CardHeader title="Inventario Crítico" />
      {critical.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">
          No hay productos en estado crítico o bajo
        </p>
      ) : (
        <DataTable columns={columns} data={critical} keyExtractor={(r) => r.product} />
      )}
      <Link
        to={ROUTES.INVENTARIO}
        className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
      >
        Ver inventario completo
        <ArrowRight className="h-4 w-4" />
      </Link>
    </Card>
  )
}
