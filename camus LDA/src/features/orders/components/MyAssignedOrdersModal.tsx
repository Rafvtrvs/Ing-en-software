import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import type { WorkOrder } from '@/types'
import { cn } from '@/utils/cn'

const PAGE_SIZE = 5

/** Ventana emergente: lista de OT asignadas al técnico en sesión */
export function MyAssignedOrdersModal({
  open,
  onClose,
  orders,
  technicianName,
  onSelect,
}: {
  open: boolean
  onClose: () => void
  orders: WorkOrder[]
  technicianName: string
  onSelect: (order: WorkOrder) => void
}) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  useEffect(() => {
    if (open) setVisibleCount(PAGE_SIZE)
  }, [open, orders.length])

  const visibleOrders = orders.slice(0, visibleCount)
  const hasMore = visibleCount < orders.length
  const canCollapse = visibleCount > PAGE_SIZE

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Mis asignadas"
      description={`Órdenes donde ${technicianName} es técnico de campo`}
      size="lg"
      footer={
        <Button variant="outline" type="button" onClick={onClose}>
          Cerrar
        </Button>
      }
    >
      {orders.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">
          No tienes órdenes asignadas en este momento.
        </p>
      ) : (
        <>
          <ul className="max-h-[60vh] space-y-2 overflow-y-auto">
            {visibleOrders.map((o) => (
              <li key={o.id}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(o)
                    onClose()
                  }}
                  className="flex w-full items-start gap-3 rounded-xl border border-slate-100 bg-white px-4 py-3 text-left transition hover:border-primary/30 hover:bg-primary/5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-slate-900">{o.id}</span>
                      <Badge label={o.status} context="order" />
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset',
                          o.priority === 'Urgente' || o.priority === 'Alta'
                            ? 'bg-red-50 text-red-700 ring-red-600/20'
                            : o.priority === 'Media'
                              ? 'bg-amber-50 text-amber-700 ring-amber-600/20'
                              : 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
                        )}
                      >
                        {o.priority ?? 'Media'}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-700">{o.client}</p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {o.service ?? o.category} · {o.address}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-400">
                      Técnico: {o.technician ?? technicianName}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
          {(hasMore || canCollapse) && (
            <div className="mt-3 flex justify-center border-t border-slate-100 pt-3">
              {hasMore ? (
                <button
                  type="button"
                  onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Ver más
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setVisibleCount(PAGE_SIZE)}
                  className="text-sm font-medium text-slate-500 hover:text-slate-700 hover:underline"
                >
                  Ver menos
                </button>
              )}
            </div>
          )}
        </>
      )}
    </Modal>
  )
}
