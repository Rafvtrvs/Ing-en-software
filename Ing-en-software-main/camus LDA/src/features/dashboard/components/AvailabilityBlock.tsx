import { Package, Wrench } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import type { Equipment, Product } from '@/types'

interface AvailabilityBlockProps {
  products: Product[]
  equipment: Equipment[]
}

export function AvailabilityBlock({ products, equipment }: AvailabilityBlockProps) {
  const availableProducts = products.filter(
    (p) => p.status === 'Ok' && p.currentStock > p.minStock,
  ).length
  const lowStock = products.filter((p) => p.status === 'Bajo' || p.status === 'Crítico').length
  const operativeEq = equipment.filter((e) => e.status === 'Operativo').length
  const maintenanceEq = equipment.filter((e) => e.status === 'Mantenimiento').length
  const assignedEq = equipment.filter((e) => e.status === 'Asignado').length
  const outOfService = equipment.filter((e) => e.status === 'Fuera de servicio').length

  return (
    <Card>
      <CardHeader
        title="Disponibilidad inventario / maquinaria"
        subtitle="Stock operativo y estado de equipos"
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <Package className="h-4 w-4 text-blue-600" />
            Inventario
          </div>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2">
              <span className="text-slate-600">Productos disponibles</span>
              <span className="font-semibold text-slate-900">{availableProducts}</span>
            </li>
            <li className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2">
              <span className="text-slate-600">Stock bajo / crítico</span>
              <Badge
                label={String(lowStock)}
                className={lowStock > 0 ? 'bg-amber-50 text-amber-700' : undefined}
              />
            </li>
            <li className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2">
              <span className="text-slate-600">Total SKUs</span>
              <span className="font-semibold text-slate-900">{products.length}</span>
            </li>
          </ul>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <Wrench className="h-4 w-4 text-amber-600" />
            Maquinaria
          </div>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2">
              <span className="text-slate-600">Operativos</span>
              <Badge label={String(operativeEq)} className="bg-emerald-50 text-emerald-700" />
            </li>
            <li className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2">
              <span className="text-slate-600">Asignados</span>
              <span className="font-semibold text-slate-900">{assignedEq}</span>
            </li>
            <li className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2">
              <span className="text-slate-600">En mantención / fuera</span>
              <span className="font-semibold text-slate-900">
                {maintenanceEq + outOfService}
              </span>
            </li>
          </ul>
        </div>
      </div>
    </Card>
  )
}
