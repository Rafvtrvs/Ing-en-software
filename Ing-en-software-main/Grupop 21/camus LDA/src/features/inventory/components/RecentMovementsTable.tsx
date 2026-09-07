import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Badge } from '@/components/ui/Badge'
import { useInventoryStore } from '@/store/useInventoryStore'
import type { StockMovement } from '@/types'
import { cn } from '@/utils/cn'

const columns: Column<StockMovement>[] = [
  { key: 'date', header: 'Fecha' },
  {
    key: 'type',
    header: 'Tipo',
    render: (row) => (
      <Badge
        label={row.type}
        className={
          row.type === 'Entrada'
            ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
            : 'bg-red-50 text-red-700 ring-red-600/20'
        }
      />
    ),
  },
  { key: 'product', header: 'Producto', className: 'font-medium text-slate-900' },
  { key: 'detail', header: 'Detalle' },
  {
    key: 'quantity',
    header: 'Cantidad',
    render: (row) => (
      <span
        className={cn(
          'font-semibold',
          row.quantity > 0 ? 'text-emerald-600' : 'text-red-500',
        )}
      >
        {row.quantity > 0 ? `+${row.quantity}` : row.quantity}
      </span>
    ),
  },
  { key: 'user', header: 'Usuario' },
]

export function RecentMovementsTable() {
  const movements = useInventoryStore((s) => s.movements)

  return (
    <Card>
      <CardHeader title="Movimientos Recientes" />
      <DataTable
        columns={columns}
        data={movements.slice(0, 5)}
        keyExtractor={(r) => r.id}
      />
      <div className="mt-4 text-right">
        <Link
          to="#"
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          onClick={(e) => e.preventDefault()}
        >
          Ver todos los movimientos
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </Card>
  )
}
