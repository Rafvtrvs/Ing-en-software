import { useEffect, useMemo, useState } from 'react'
import { Calculator, Filter } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { KpiCard } from '@/components/ui/KpiCard'
import { useOrdersStore } from '@/store/useOrdersStore'
import { useReportsStore } from '@/store/useReportsStore'
import type { KpiData, ReportPeriod, WorkOrder } from '@/types'
import { formatCurrency } from '@/utils/formatters'

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

function isoDate(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

function parseClDate(value: string): Date | null {
  // Formato esperado: dd/mm/yyyy
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim())
  if (!m) return null
  const dd = Number(m[1])
  const mm = Number(m[2])
  const yyyy = Number(m[3])
  const d = new Date(yyyy, mm - 1, dd, 12, 0, 0)
  return Number.isNaN(d.getTime()) ? null : d
}

function periodRange(period: ReportPeriod): { from: string; to: string } {
  const now = new Date()
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0)

  if (period === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1, 12, 0, 0)
    return { from: isoDate(start), to: isoDate(end) }
  }
  if (period === 'quarter') {
    const start = new Date(now.getFullYear(), now.getMonth() - 2, 1, 12, 0, 0)
    return { from: isoDate(start), to: isoDate(end) }
  }
  const start = new Date(now.getFullYear(), 0, 1, 12, 0, 0)
  return { from: isoDate(start), to: isoDate(end) }
}

function clampNonNegative(n: number) {
  if (!Number.isFinite(n)) return 0
  return Math.max(0, n)
}

export function CostsReportPanel() {
  const orders = useOrdersStore((s) => s.orders)
  const period = useReportsStore((s) => s.period)

  const [showFilters, setShowFilters] = useState(true)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  // Parámetros operacionales (mock)
  const [laborCostPerOrder, setLaborCostPerOrder] = useState('65000')
  const [fuelCostPerOrder, setFuelCostPerOrder] = useState('25000')
  const [maintenanceFixed, setMaintenanceFixed] = useState('180000')
  const [overheadPercent, setOverheadPercent] = useState('12')

  const [result, setResult] = useState<{
    executed: boolean
    ordersCount: number
    labor: number
    fuel: number
    maintenance: number
    overhead: number
    total: number
    costPerOrder: number
  }>({
    executed: false,
    ordersCount: 0,
    labor: 0,
    fuel: 0,
    maintenance: 0,
    overhead: 0,
    total: 0,
    costPerOrder: 0,
  })

  useEffect(() => {
    const r = periodRange(period)
    setFrom(r.from)
    setTo(r.to)
  }, [period])

  const ordersInRange = useMemo(() => {
    if (!from || !to) return [] as WorkOrder[]
    const start = new Date(`${from}T00:00:00`).getTime()
    const end = new Date(`${to}T23:59:59`).getTime()
    return orders.filter((o) => {
      const d = parseClDate(o.createdAt)
      if (!d) return false
      const t = d.getTime()
      return t >= start && t <= end
    })
  }, [orders, from, to])

  const canExecute = Boolean(from && to)

  const execute = () => {
    if (!from || !to) return
    const start = new Date(`${from}T00:00:00`).getTime()
    const end = new Date(`${to}T23:59:59`).getTime()
    if (Number.isNaN(start) || Number.isNaN(end) || start > end) {
      setResult((r) => ({ ...r, executed: false }))
      return
    }

    const count = ordersInRange.length
    const laborUnit = clampNonNegative(Number(laborCostPerOrder))
    const fuelUnit = clampNonNegative(Number(fuelCostPerOrder))
    const maintenance = clampNonNegative(Number(maintenanceFixed))
    const overheadRate = clampNonNegative(Number(overheadPercent)) / 100

    const labor = laborUnit * count
    const fuel = fuelUnit * count
    const base = labor + fuel + maintenance
    const overhead = base * overheadRate
    const total = base + overhead

    setResult({
      executed: true,
      ordersCount: count,
      labor,
      fuel,
      maintenance,
      overhead,
      total,
      costPerOrder: count > 0 ? total / count : 0,
    })
  }

  const kpis: KpiData[] = [
    {
      title: 'Órdenes del período',
      value: String(result.executed ? result.ordersCount : ordersInRange.length),
      trend: `${from || '—'} a ${to || '—'}`,
      trendDirection: 'up',
      icon: Calculator,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Costos operacionales',
      value: result.executed ? formatCurrency(result.total) : '—',
      trend: 'Incluye mano de obra, combustible, mantención y overhead',
      trendDirection: 'down',
      icon: Calculator,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
    },
    {
      title: 'Costo por orden',
      value: result.executed ? formatCurrency(result.costPerOrder) : '—',
      trend: 'Promedio del período',
      trendDirection: 'down',
      icon: Calculator,
      iconBg: 'bg-violet-50',
      iconColor: 'text-violet-600',
    },
    {
      title: 'Overhead',
      value: result.executed ? formatCurrency(result.overhead) : '—',
      trend: `${clampNonNegative(Number(overheadPercent))}% del costo base`,
      trendDirection: 'down',
      icon: Calculator,
      iconBg: 'bg-slate-50',
      iconColor: 'text-slate-700',
    },
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Reporte de costos"
          subtitle="Ingresa parámetros operacionales, define el período y confirma para generar el reporte."
          action={
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Filter className="h-4 w-4" />}
              onClick={() => setShowFilters((v) => !v)}
            >
              Opciones
            </Button>
          }
        />

        {showFilters && (
          <div className="grid gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4 lg:grid-cols-6">
            <div className="lg:col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-slate-600">Período</label>
              <Select
                value={period}
                onChange={(e) => useReportsStore.getState().setPeriod(e.target.value as ReportPeriod)}
              >
                <option value="month">Este mes</option>
                <option value="quarter">Último trimestre</option>
                <option value="year">Este año</option>
              </Select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600">Desde</label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600">Hasta</label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600">
                Mano de obra / OT
              </label>
              <Input
                type="number"
                min={0}
                value={laborCostPerOrder}
                onChange={(e) => setLaborCostPerOrder(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600">
                Combustible / OT
              </label>
              <Input
                type="number"
                min={0}
                value={fuelCostPerOrder}
                onChange={(e) => setFuelCostPerOrder(e.target.value)}
              />
            </div>

            <div className="lg:col-span-3">
              <label className="mb-1.5 block text-xs font-medium text-slate-600">
                Mantención fija (período)
              </label>
              <Input
                type="number"
                min={0}
                value={maintenanceFixed}
                onChange={(e) => setMaintenanceFixed(e.target.value)}
              />
            </div>
            <div className="lg:col-span-3">
              <label className="mb-1.5 block text-xs font-medium text-slate-600">
                Overhead (%)
              </label>
              <Input
                type="number"
                min={0}
                max={100}
                value={overheadPercent}
                onChange={(e) => setOverheadPercent(e.target.value)}
              />
            </div>
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-slate-600">
            {result.executed ? (
              <span>
                Reporte generado: <span className="font-semibold">{formatCurrency(result.total)}</span>{' '}
                <span className="text-slate-500">({result.ordersCount} OT)</span>
              </span>
            ) : (
              <span>Ingresa parámetros, valida el período y confirma.</span>
            )}
          </div>
          <Button type="button" onClick={execute} disabled={!canExecute}>
            Confirmar
          </Button>
        </div>

        {result.executed && (
          <div className="mt-4 grid gap-3 rounded-xl border border-slate-100 bg-white p-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-slate-500">Mano de obra</p>
              <p className="font-semibold text-slate-900">{formatCurrency(result.labor)}</p>
            </div>
            <div>
              <p className="text-slate-500">Combustible</p>
              <p className="font-semibold text-slate-900">{formatCurrency(result.fuel)}</p>
            </div>
            <div>
              <p className="text-slate-500">Mantención fija</p>
              <p className="font-semibold text-slate-900">{formatCurrency(result.maintenance)}</p>
            </div>
            <div>
              <p className="text-slate-500">Overhead</p>
              <p className="font-semibold text-slate-900">{formatCurrency(result.overhead)}</p>
            </div>
          </div>
        )}
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.title} data={kpi} />
        ))}
      </div>
    </div>
  )
}

