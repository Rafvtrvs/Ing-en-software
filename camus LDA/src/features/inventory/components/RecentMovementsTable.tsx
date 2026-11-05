import { useMemo, useState } from 'react'
import { ArrowRight, ChevronUp } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Badge } from '@/components/ui/Badge'
import { useInventoryStore } from '@/store/useInventoryStore'
import type { StockMovement } from '@/types'
import { cn } from '@/utils/cn'

const PREVIEW_COUNT = 5

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
          row.type === 'Entrada' ? 'text-emerald-600' : 'text-red-500',
        )}
      >
        {row.type === 'Entrada' ? `+${row.quantity}` : `-${row.quantity}`}
      </span>
    ),
  },
  { key: 'user', header: 'Usuario' },
]

export function RecentMovementsTable() {
  const movements = useInventoryStore((s) => s.movements)
  const [showAll, setShowAll] = useState(false)

  const sorted = useMemo(
    () =>
      [...movements].sort((a, b) => {
        // Más recientes primero (orden de inserción suele bastar; id como respaldo)
        return b.id.localeCompare(a.id)
      }),
    [movements],
  )

  const visible = showAll ? sorted : sorted.slice(0, PREVIEW_COUNT)
  const hasMore = sorted.length > PREVIEW_COUNT

  return (
    <Card>
      <CardHeader
        title="Movimientos Recientes"
        action={
          <span className="text-xs font-medium text-slate-500">
            {sorted.length} registro{sorted.length === 1 ? '' : 's'}
          </span>
        }
      />
      {sorted.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">
          Aún no hay movimientos registrados.
        </p>
      ) : (
        <>
          <div className={showAll ? 'max-h-[28rem] overflow-y-auto' : undefined}>
            <DataTable columns={columns} data={visible} keyExtractor={(r) => r.id} />
          </div>
          {hasMore ? (
            <div className="mt-4 text-right">
              <button
                type="button"
                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                onClick={() => setShowAll((prev) => !prev)}
              >
                {showAll ? (
                  <>
                    Mostrar menos
                    <ChevronUp className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    Ver todos los movimientos ({sorted.length})
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          ) : null}
        </>
      )}
    </Card>
  )
}
