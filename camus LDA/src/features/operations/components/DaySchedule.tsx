import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useOrdersStore } from '@/store/useOrdersStore'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/utils/cn'
import type { WorkOrder } from '@/types'

const statusColors: Record<string, string> = {
  Completada: 'border-l-emerald-500 bg-emerald-50/50',
  'En Curso': 'border-l-amber-500 bg-amber-50/50',
  Pendiente: 'border-l-blue-500 bg-blue-50/30',
  Abonado: 'border-l-violet-500 bg-violet-50/40',
  Cancelada: 'border-l-slate-300 bg-slate-50',
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function orderAgendaDate(order: WorkOrder): string {
  return (
    order.executionDate ||
    order.startDate ||
    order.createdAt ||
    ''
  ).slice(0, 10)
}

function formatClock(value?: string): string | null {
  if (!value) return null
  if (/^\d{1,2}:\d{2}/.test(value)) return value.slice(0, 5)
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
}

function agendaTimeRange(order: WorkOrder): string {
  const start =
    formatClock(order.serviceStartedAt) ||
    formatClock(order.startDate) ||
    null
  const end =
    formatClock(order.serviceEndedAt) ||
    formatClock(order.endDate) ||
    null
  if (start && end) return `${start} – ${end}`
  if (start) return `Desde ${start}`
  if (end) return `Hasta ${end}`
  return 'Sin hora definida'
}

/** Agenda del día con OT reales del sistema (fecha de ejecución / inicio / creación = hoy). */
export function DaySchedule() {
  const orders = useOrdersStore((s) => s.orders)
  const syncFromApi = useOrdersStore((s) => s.syncFromApi)
  const openViewModal = useOrdersStore((s) => s.openViewModal)

  useEffect(() => {
    void syncFromApi()
  }, [syncFromApi])

  const today = todayIso()

  const agenda = useMemo(() => {
    return orders
      .filter((o) => {
        if (o.status === 'Cancelada' || o.annulled) return false
        return orderAgendaDate(o) === today
      })
      .sort((a, b) => {
        const ta = a.serviceStartedAt || a.startDate || a.id
        const tb = b.serviceStartedAt || b.startDate || b.id
        return String(ta).localeCompare(String(tb))
      })
  }, [orders, today])

  return (
    <Card>
      <CardHeader
        title="Agenda del Día"
        subtitle={
          agenda.length === 0
            ? 'Sin órdenes programadas para hoy'
            : `${agenda.length} orden(es) para hoy`
        }
      />
      {agenda.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500">
          No hay OT con fecha de hoy en el sistema. Aparecen las que tienen
          ejecución, inicio o creación igual a la fecha actual.
        </p>
      ) : (
        <div className="space-y-2">
          {agenda.map((order) => (
            <button
              key={order.id}
              type="button"
              onClick={() => openViewModal(order)}
              className={cn(
                'w-full rounded-lg border-l-4 px-4 py-3 text-left transition-colors hover:brightness-[0.98]',
                statusColors[order.status] ?? 'border-l-slate-300 bg-slate-50',
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-500">
                  {agendaTimeRange(order)}
                </span>
                <Badge label={order.status} context="order" />
              </div>
              <p className="mt-1 text-sm font-semibold text-slate-900">{order.id}</p>
              <p className="text-sm text-slate-600">
                {order.service || order.category || order.client}
              </p>
              <p className="text-xs text-slate-500">{order.address || 'Sin dirección'}</p>
            </button>
          ))}
        </div>
      )}
      <Link
        to={ROUTES.ORDENES}
        className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
      >
        Ver todas las órdenes
        <ArrowRight className="h-4 w-4" />
      </Link>
    </Card>
  )
}
