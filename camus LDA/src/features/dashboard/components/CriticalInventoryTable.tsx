import { Card, CardHeader } from '@/components/ui/Card'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Badge } from '@/components/ui/Badge'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { criticalInventory } from '@/data/mock/dashboard'
import type { InventoryItem } from '@/types'
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

export function CriticalInventoryTable() {
  return (
    <Card>
      <CardHeader title="Inventario Crítico" />
      <DataTable columns={columns} data={criticalInventory} keyExtractor={(r) => r.product} />
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
