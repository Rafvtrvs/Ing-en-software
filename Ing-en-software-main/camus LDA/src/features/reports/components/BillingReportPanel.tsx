import { CheckCircle, Clock, DollarSign, FileText, Filter, Search } from 'lucide-react'
import { KpiCard } from '@/components/ui/KpiCard'
import type { KpiData } from '@/types'
import { useBillingStore } from '@/store/useBillingStore'
import { formatCurrency } from '@/utils/formatters'
import { getBillingRevenueStats } from '@/features/reports/utils/reportStats'
import { getInvoicesByStatus } from '@/features/billing/utils/billingStats'
import { RevenueTrendChart } from './RevenueTrendChart'
import { ReportDonutChart } from './ReportDonutChart'
import { ReportExportCatalog } from './ReportExportCatalog'
import { Card, CardHeader } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { useMemo, useState } from 'react'
import type { PaymentMethod } from '@/types'

export function BillingReportPanel() {
  const invoices = useBillingStore((s) => s.invoices)
  const payments = useBillingStore((s) => s.payments)
  const stats = getBillingRevenueStats(invoices)
  const statusChart = getInvoicesByStatus(invoices)

  const [showFilters, setShowFilters] = useState(true)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [method, setMethod] = useState<PaymentMethod | 'all'>('all')
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<{
    executed: boolean
    income: number
    count: number
  }>({ executed: false, income: 0, count: 0 })

  const availableMethods = useMemo(() => {
    const set = new Set<PaymentMethod>()
    payments.forEach((p) => set.add(p.method))
    return Array.from(set.values())
  }, [payments])

  const canExecute = Boolean(from && to)
  const executeQuery = () => {
    if (!from || !to) return
    const start = new Date(`${from}T00:00:00`).getTime()
    const end = new Date(`${to}T23:59:59`).getTime()
    const q = query.trim().toLowerCase()

    const filtered = payments.filter((p) => {
      const time = new Date(`${p.date}T12:00:00`).getTime()
      if (Number.isNaN(time)) return false
      if (time < start || time > end) return false
      if (method !== 'all' && p.method !== method) return false
      if (
        q &&
        !p.invoiceNumber.toLowerCase().includes(q) &&
        !p.client.toLowerCase().includes(q)
      ) {
        return false
      }
      return true
    })

    setResult({
      executed: true,
      income: filtered.reduce((s, p) => s + p.amount, 0),
      count: filtered.length,
    })
  }

  const kpis: KpiData[] = [
    {
      title: 'Total Facturado',
      value: formatCurrency(stats.totalBilled).replace(/\s/g, ' '),
      trend: 'Período actual',
      trendDirection: 'up',
      icon: FileText,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Total Cobrado',
      value: formatCurrency(stats.totalCollected).replace(/\s/g, ' '),
      trend: `${stats.paidCount} facturas pagadas`,
      trendDirection: 'up',
      icon: CheckCircle,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
    },
    {
      title: 'Por Cobrar',
      value: formatCurrency(stats.pendingAmount).replace(/\s/g, ' '),
      trend: `${stats.pendingCount} pendientes`,
      trendDirection: 'down',
      icon: Clock,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
    },
    {
      title: 'Tasa de Cobro',
      value: stats.totalBilled
        ? `${Math.round((stats.totalCollected / stats.totalBilled) * 100)}%`
        : '0%',
      trend: 'Del total facturado',
      trendDirection: 'up',
      icon: DollarSign,
      iconBg: 'bg-violet-50',
      iconColor: 'text-violet-600',
    },
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Reportes financieros"
          subtitle="Selecciona un rango de fechas y ejecuta la consulta para ver ingresos del período."
          action={
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Filter className="h-4 w-4" />}
              onClick={() => setShowFilters((v) => !v)}
            >
              Filtros
            </Button>
          }
        />

        {showFilters && (
          <div className="mb-4 grid gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4 lg:grid-cols-5">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600">Desde</label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600">Hasta</label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600">Medio de pago</label>
              <Select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod | 'all')}>
                <option value="all">Todos</option>
                {availableMethods.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </Select>
            </div>
            <div className="lg:col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-slate-600">Buscar</label>
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Factura o cliente..."
                icon={<Search className="h-4 w-4" />}
              />
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-slate-600">
            {result.executed ? (
              <span>
                Ingresos del período: <span className="font-semibold text-slate-900">{formatCurrency(result.income)}</span>{' '}
                <span className="text-slate-500">({result.count} pagos)</span>
              </span>
            ) : (
              <span>Selecciona un rango y ejecuta la consulta.</span>
            )}
          </div>
          <Button type="button" onClick={executeQuery} disabled={!canExecute}>
            Ejecutar consulta
          </Button>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.title} data={kpi} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <RevenueTrendChart />
        <ReportDonutChart title="Facturas por Estado" data={statusChart} />
      </div>

      <ReportExportCatalog filterTab="facturacion" />
    </div>
  )
}
