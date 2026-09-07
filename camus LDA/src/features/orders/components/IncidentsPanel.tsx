import { useMemo, useState } from 'react'
import { AlertTriangle, Download, Pencil } from 'lucide-react'
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import { Card, CardHeader } from '@/components/ui/Card'
import { ChartLegend } from '@/components/ui/ChartLegend'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { useOrdersStore } from '@/store/useOrdersStore'
import { exportIncidentsToCsv } from '@/features/orders/utils/exportIncidents'
import { INCIDENT_TYPES } from '@/features/orders/utils/priorityRules'
import type { IncidentType, WorkOrder } from '@/types'

const COLORS = ['#dc2626', '#ea580c', '#2563eb', '#0d9488', '#ca8a04', '#7c3aed', '#64748b']

/** CU-165–169: tabla, gráfico, filtro, edición y export CSV de incidentes */
export function IncidentsPanel() {
  const orders = useOrdersStore((s) => s.orders)
  const updateOrder = useOrdersStore((s) => s.updateOrder)
  const openEditModal = useOrdersStore((s) => s.openEditModal)
  const addToast = useOrdersStore((s) => s.addToast)
  const [typeFilter, setTypeFilter] = useState<IncidentType | 'all'>('all')

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const t = o.incidentType ?? o.category
      return typeFilter === 'all' || t === typeFilter
    })
  }, [orders, typeFilter])

  const chartData = useMemo(() => {
    const map = new Map<string, number>()
    for (const o of orders) {
      const t = o.incidentType ?? o.category ?? 'Otros'
      map.set(t, (map.get(t) ?? 0) + 1)
    }
    return [...map.entries()].map(([name, value], i) => ({
      name,
      value,
      color: COLORS[i % COLORS.length],
    }))
  }, [orders])

  const total = chartData.reduce((s, d) => s + d.value, 0)

  const columns: Column<WorkOrder>[] = [
    { key: 'id', header: 'OT', className: 'font-medium text-slate-900' },
    { key: 'client', header: 'Cliente' },
    {
      key: 'incidentType',
      header: 'Incidente',
      render: (row) => (
        <Select
          value={(row.incidentType ?? row.category) as string}
          onChange={(e) => {
            const incidentType = e.target.value as IncidentType
            updateOrder(row.id, {
              incidentType,
              category: incidentType,
            })
            addToast(`Incidente de ${row.id} actualizado`)
          }}
          className="max-w-[180px] text-xs"
        >
          {INCIDENT_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </Select>
      ),
    },
    {
      key: 'priority',
      header: 'Prioridad',
      render: (row) => (
        <span className="text-xs font-semibold text-slate-700">
          {row.priority ?? 'Media'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      render: (row) => <Badge label={row.status} context="order" />,
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <button
          type="button"
          onClick={() => openEditModal(row)}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-amber-600"
          aria-label={`Editar ${row.id}`}
        >
          <Pencil className="h-4 w-4" />
        </button>
      ),
    },
  ]

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader
          title="Incidentes por orden"
          subtitle="Tipos Obstrucción, Fuga, Colapso, etc."
          action={
            <div className="flex flex-wrap gap-2">
              <Select
                value={typeFilter}
                onChange={(e) =>
                  setTypeFilter(e.target.value as IncidentType | 'all')
                }
                className="min-w-[160px]"
              >
                <option value="all">Todos los tipos</option>
                {INCIDENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
              <Button
                variant="outline"
                leftIcon={<Download className="h-4 w-4" />}
                onClick={() => {
                  exportIncidentsToCsv(filtered)
                  addToast(`${filtered.length} incidentes exportados a CSV`)
                }}
              >
                Exportar CSV
              </Button>
            </div>
          }
        />
        <DataTable
          columns={columns}
          data={filtered}
          keyExtractor={(r) => r.id}
        />
      </Card>

      <Card>
        <CardHeader
          title="Distribución de incidentes"
          subtitle="Gráfico por tipo"
        />
        {total === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">Sin datos</p>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="relative h-40 w-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={42}
                    outerRadius={64}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <span className="text-lg font-bold text-slate-900">{total}</span>
              </div>
            </div>
            <ChartLegend
              items={chartData.map((d) => ({
                name: d.name,
                value: d.value,
                color: d.color,
              }))}
              total={total}
            />
          </div>
        )}
      </Card>
    </div>
  )
}
