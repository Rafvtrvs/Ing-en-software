import { useMemo, useState } from 'react'
import { Download, Search, UserCheck, UserX } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { useOrdersStore } from '@/store/useOrdersStore'
import { useUsersStore } from '@/store/useUsersStore'
import {
  computeOperatorAvailability,
  exportAvailabilityToCsv,
} from '@/features/operations/utils/operatorAvailability'
import type { OrderOperator } from '@/types'

/**
 * RF60 — CDS 209: Consultar disponibilidad de operadores
 */
export function OperatorAvailabilityPanel() {
  const orders = useOrdersStore((s) => s.orders)
  const users = useUsersStore((s) => s.users)
  const roles = useUsersStore((s) => s.roles)
  const addToast = useOrdersStore((s) => s.addToast)

  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [orderFilter, setOrderFilter] = useState('all')
  const [search, setSearch] = useState('')

  const operators: OrderOperator[] = useMemo(() => {
    const techRoleIds = new Set(
      roles
        .filter((r) => {
          const n = r.name.toLowerCase()
          return (
            n.includes('técnico') ||
            n.includes('tecnico') ||
            n.includes('operador') ||
            n.includes('campo')
          )
        })
        .map((r) => r.id),
    )
    return users
      .filter((u) => u.status === 'Activo' && techRoleIds.has(u.roleId))
      .map((u) => ({ id: u.id, name: u.name }))
  }, [users, roles])

  const rows = useMemo(() => {
    const data = computeOperatorAvailability(operators, orders, {
      orderId: orderFilter !== 'all' ? orderFilter : undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    })
    const q = search.toLowerCase().trim()
    if (!q) return data
    return data.filter((r) => r.operator.name.toLowerCase().includes(q))
  }, [operators, orders, orderFilter, dateFrom, dateTo, search])

  const availableCount = rows.filter((r) => r.status === 'Disponible').length
  const busyCount = rows.filter((r) => r.status === 'Ocupado').length

  return (
    <Card className="overflow-hidden">
      <CardHeader
        title="Disponibilidad de Operadores"
        subtitle="Consulta operadores disponibles y ocupados según asignaciones y fechas."
        action={
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="h-4 w-4" />}
            onClick={() => {
              exportAvailabilityToCsv(rows)
              addToast('Disponibilidad exportada a CSV', 'info')
            }}
          >
            Exportar
          </Button>
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
          <div className="flex items-center gap-2 text-emerald-700">
            <UserCheck className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase">Disponibles</span>
          </div>
          <p className="mt-1 text-2xl font-bold text-emerald-900">{availableCount}</p>
        </div>
        <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
          <div className="flex items-center gap-2 text-amber-700">
            <UserX className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase">Ocupados</span>
          </div>
          <p className="mt-1 text-2xl font-bold text-amber-900">{busyCount}</p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="md:col-span-2 xl:col-span-1">
          <label className="mb-1.5 block text-xs font-medium text-slate-600">
            Buscar operador
          </label>
          <Input
            placeholder="Nombre del operador..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="h-4 w-4" />}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-600">
            Desde
          </label>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-600">
            Hasta
          </label>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
        <div className="md:col-span-2 xl:col-span-1">
          <label className="mb-1.5 block text-xs font-medium text-slate-600">
            Orden de trabajo
          </label>
          <Select
            value={orderFilter}
            onChange={(e) => setOrderFilter(e.target.value)}
            aria-label="Filtrar por orden de trabajo"
            className="w-full"
          >
            <option value="all">Todas las OT</option>
            {orders.map((o) => (
              <option key={o.id} value={o.id}>
                {o.id}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="mb-4 flex justify-end">
        <Button variant="primary" onClick={() => addToast('Disponibilidad actualizada', 'info')}>
          Consultar disponibilidad
        </Button>
      </div>

      {rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">
          No hay registros para mostrar.
        </p>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <div
              key={row.operator.id}
              className="rounded-xl border border-slate-100 bg-slate-50/60 p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">{row.operator.name}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Periodo: {row.occupiedPeriodLabel}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    label={row.status}
                    className={
                      row.status === 'Disponible'
                        ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
                        : 'bg-amber-50 text-amber-700 ring-amber-600/20'
                    }
                  />
                  <span className="text-xs text-slate-500">
                    {row.activeOrders} OT activa(s)
                  </span>
                </div>
              </div>

              {row.assignments.length > 0 && (
                <ul className="mt-3 space-y-2 border-t border-slate-200/80 pt-3">
                  {row.assignments.map((slot) => (
                    <li
                      key={slot.orderId}
                      className="flex flex-col gap-1 rounded-lg bg-white px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <span className="font-medium text-slate-800">{slot.orderId}</span>
                        <span className="mx-2 text-slate-300">·</span>
                        <span className="text-slate-600">{slot.client}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <Badge label={slot.status} context="order" />
                        <span className="text-slate-500">{slot.periodLabel}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
