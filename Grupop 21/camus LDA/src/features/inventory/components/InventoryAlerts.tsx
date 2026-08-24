import { AlertTriangle, Package } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useInventoryStore } from '@/store/useInventoryStore'

export function InventoryAlerts() {
  const products = useInventoryStore((s) => s.products)
  const openViewModal = useInventoryStore((s) => s.openViewModal)

  const alerts = products
    .filter((p) => p.status === 'Crítico' || p.status === 'Bajo')
    .sort((a, b) => (a.status === 'Crítico' ? -1 : 1) - (b.status === 'Crítico' ? -1 : 1))
    .slice(0, 5)

  return (
    <Card>
      <CardHeader title="Alertas de Inventario" />
      {alerts.length === 0 ? (
        <p className="rounded-lg bg-emerald-50 px-4 py-6 text-center text-sm text-emerald-700">
          No hay alertas activas. El inventario está en buen estado.
        </p>
      ) : (
        <ul className="divide-y divide-slate-50">
          {alerts.map((product) => (
            <li
              key={product.id}
              className="flex items-start gap-3 py-3.5 first:pt-0"
            >
              <div
                className={
                  product.status === 'Crítico'
                    ? 'rounded-lg bg-red-50 p-2 text-red-500'
                    : 'rounded-lg bg-amber-50 p-2 text-amber-600'
                }
              >
                {product.status === 'Crítico' ? (
                  <AlertTriangle className="h-4 w-4" />
                ) : (
                  <Package className="h-4 w-4" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-900">{product.name}</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Stock: {product.currentStock} / mín. {product.minStock} {product.unit}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <Badge label={product.status} />
                <button
                  type="button"
                  onClick={() => openViewModal(product)}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Ver producto
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
