import { AlertTriangle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { mockEquipment } from '@/data/mock/equipment'
import { ROUTES } from '@/constants/routes'
import type { Equipment } from '@/types'

/** RF-30 — alerta de maquinaria no disponible en el panel principal */
export function UnavailableEquipmentAlert({
  equipment = mockEquipment,
}: {
  equipment?: Equipment[]
}) {
  const unavailable = equipment.filter(
    (eq) => eq.status === 'Fuera de servicio' || eq.status === 'Mantenimiento',
  )

  return (
    <Card>
      <CardHeader
        title="Alertas de maquinaria no disponible"
        subtitle="Equipos en mantención o fuera de servicio (RF-30)"
        action={
          unavailable.length > 0 ? (
            <Badge
              label={`${unavailable.length} no disponible${unavailable.length === 1 ? '' : 's'}`}
              className="bg-amber-50 text-amber-800"
            />
          ) : undefined
        }
      />
      {unavailable.length === 0 ? (
        <p className="flex items-center gap-2 text-sm text-slate-500">
          <AlertTriangle className="h-4 w-4 text-emerald-500" />
          No hay maquinaria bloqueada para asignación.
        </p>
      ) : (
        <ul className="space-y-2">
          {unavailable.slice(0, 5).map((eq) => (
            <li
              key={eq.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-100 bg-amber-50/60 px-3 py-2 text-sm"
            >
              <span className="font-medium text-slate-900">
                {eq.code} — {eq.name}
              </span>
              <Badge
                label={eq.status}
                className={
                  eq.status === 'Fuera de servicio'
                    ? 'bg-red-50 text-red-700'
                    : 'bg-amber-50 text-amber-800'
                }
              />
            </li>
          ))}
          <li>
            <Link
              to={ROUTES.INVENTARIO}
              className="inline-flex items-center rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Ver equipos
            </Link>
          </li>
        </ul>
      )}
    </Card>
  )
}
