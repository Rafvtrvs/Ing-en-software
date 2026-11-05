import { useEffect, useState } from 'react'
import { ArrowRight, ChevronUp, History } from 'lucide-react'
import { ordersService } from '@/services/ordersService'
import type { StatusChange } from '@/types'

const PREVIEW_COUNT = 5

/**
 * RF29 CU-99 — historial de cambios de estado con fecha, hora y autor.
 * Con `orderId` muestra solo esa OT; sin él, el historial global.
 * `refreshKey` permite recargar tras un cambio de estado.
 */
export function StatusHistoryPanel({
  orderId,
  refreshKey,
}: {
  orderId?: string
  refreshKey?: string
}) {
  const [items, setItems] = useState<StatusChange[] | null>(null)
  const [error, setError] = useState(false)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    let cancelled = false
    setShowAll(false)
    ordersService
      .listStatusHistory(orderId)
      .then((d) => {
        if (!cancelled) {
          setItems(d)
          setError(false)
        }
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
    return () => {
      cancelled = true
    }
  }, [orderId, refreshKey])

  const hasMore = (items?.length ?? 0) > PREVIEW_COUNT
  const visible = showAll ? items ?? [] : (items ?? []).slice(0, PREVIEW_COUNT)

  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-slate-400" />
          <p className="text-sm font-semibold text-slate-900">Historial de cambios de estado</p>
        </div>
        {items && items.length > 0 ? (
          <span className="text-xs font-medium text-slate-500">
            {items.length} registro{items.length === 1 ? '' : 's'}
          </span>
        ) : null}
      </div>
      {error && <p className="text-sm text-slate-500">Historial no disponible.</p>}
      {!error && items && items.length === 0 && (
        <p className="text-sm text-slate-500">No hay cambios de estado registrados.</p>
      )}
      {items && items.length > 0 && (
        <>
          <div className={showAll ? 'max-h-[22rem] overflow-y-auto' : undefined}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs uppercase text-slate-500">
                    <th className="px-2 py-2">Fecha</th>
                    <th className="px-2 py-2">Hora</th>
                    {!orderId && <th className="px-2 py-2">Orden</th>}
                    <th className="px-2 py-2">Cambio</th>
                    <th className="px-2 py-2">Autor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {visible.map((c) => {
                    const d = new Date(c.at)
                    return (
                      <tr key={c.id}>
                        <td className="px-2 py-2 text-slate-600">
                          {d.toLocaleDateString('es-CL')}
                        </td>
                        <td className="px-2 py-2 text-slate-600">
                          {d.toLocaleTimeString('es-CL', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        {!orderId && (
                          <td className="px-2 py-2 font-medium text-slate-900">{c.orderId}</td>
                        )}
                        <td className="px-2 py-2 text-slate-700">
                          {c.from || '—'} → {c.to}
                        </td>
                        <td className="px-2 py-2 text-slate-600">{c.user}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
          {hasMore ? (
            <div className="mt-3 text-right">
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
                    Ver más ({items.length - PREVIEW_COUNT} restantes)
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}
