import { useMemo } from 'react'
import { useOrdersStore } from '@/store/useOrdersStore'
import type { IncidentType } from '@/types'

/** RF-56 CU-200 — duración promedio por tipo de incidente */
export function ServiceTimesReportPanel() {
  const orders = useOrdersStore((s) => s.orders)

  const rows = useMemo(() => {
    const groups = new Map<string, number[]>()
    for (const order of orders) {
      if (order.durationHours == null || order.durationHours <= 0) continue
      if (!order.serviceEndedAt && order.status !== 'Completada' && order.status !== 'Abonado') {
        continue
      }
      const key = order.incidentType ?? 'Sin tipo'
      const list = groups.get(key) ?? []
      list.push(order.durationHours)
      groups.set(key, list)
    }
    return [...groups.entries()]
      .map(([type, hours]) => {
        const avg = hours.reduce((sum, value) => sum + value, 0) / hours.length
        return {
          type: type as IncidentType | 'Sin tipo',
          count: hours.length,
          avg: Math.round(avg * 10) / 10,
        }
      })
      .sort((a, b) => b.avg - a.avg)
  }, [orders])

  const max = Math.max(1, ...rows.map((row) => row.avg))

  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <h2 className="text-base font-semibold text-slate-900">Tiempos de operación</h2>
      <p className="mt-1 text-sm text-slate-500">
        Promedio de duración real de servicios finalizados, agrupado por tipo de incidente.
      </p>
      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">
          Aún no hay órdenes finalizadas con marcas de inicio y término.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {rows.map((row) => (
            <li key={row.type}>
              <div className="mb-1 flex justify-between text-sm">
                <span className="font-medium text-slate-800">{row.type}</span>
                <span className="tabular-nums text-slate-600">
                  {row.avg} h · {row.count} OT
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${Math.max(8, (row.avg / max) * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
