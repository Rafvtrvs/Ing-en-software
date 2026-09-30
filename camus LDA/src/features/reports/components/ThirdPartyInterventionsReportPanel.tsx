import { useMemo, useState } from 'react'
import { Building2, Download, FileText } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { useOrdersStore } from '@/store/useOrdersStore'
import { useReportsStore } from '@/store/useReportsStore'
import type { ThirdPartyReportRow } from '@/types'

/** RF47 — CU-158 / CU-159 */
export function ThirdPartyInterventionsReportPanel() {
  const orders = useOrdersStore((s) => s.orders)
  const addToast = useReportsStore((s) => s.addToast)
  const [companyFilter, setCompanyFilter] = useState('all')
  const [orderFilter, setOrderFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [reportHtml, setReportHtml] = useState<string | null>(null)

  const rows = useMemo(() => {
    const list: ThirdPartyReportRow[] = []
    for (const order of orders) {
      for (const tp of order.thirdParties ?? []) {
        list.push({
          id: tp.id,
          orderId: order.id,
          client: order.client,
          company: tp.company,
          detail: tp.detail,
          registeredAt: tp.registeredAt,
        })
      }
    }
    return list.sort(
      (a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime(),
    )
  }, [orders])

  const companies = useMemo(
    () => Array.from(new Set(rows.map((r) => r.company))).sort(),
    [rows],
  )

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return rows.filter((r) => {
      if (companyFilter !== 'all' && r.company !== companyFilter) return false
      if (orderFilter !== 'all' && r.orderId !== orderFilter) return false
      if (!q) return true
      return (
        r.company.toLowerCase().includes(q) ||
        r.detail.toLowerCase().includes(q) ||
        r.client.toLowerCase().includes(q) ||
        r.orderId.toLowerCase().includes(q)
      )
    })
  }, [rows, companyFilter, orderFilter, search])

  const orderOptions = useMemo(
    () => Array.from(new Set(rows.map((r) => r.orderId))),
    [rows],
  )

  const handleGenerate = () => {
    if (filtered.length === 0) {
      addToast('No hay intervenciones de terceros para generar el reporte', 'error')
      return
    }
    const lines = filtered
      .map(
        (r) =>
          `<tr><td>${r.orderId}</td><td>${r.client}</td><td>${r.company}</td><td>${r.detail}</td><td>${r.registeredAt}</td></tr>`,
      )
      .join('')
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Intervenciones de terceros</title>
<style>body{font-family:system-ui,sans-serif;padding:24px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f1f5f9}</style></head>
<body><h1>Reporte — Intervenciones de terceros</h1><p>Registros: ${filtered.length}</p>
<table><thead><tr><th>OT</th><th>Cliente</th><th>Empresa</th><th>Detalle</th><th>Fecha</th></tr></thead><tbody>${lines}</tbody></table></body></html>`
    setReportHtml(html)
    addToast('Reporte generado correctamente')
  }

  const handleDownload = () => {
    if (!reportHtml) {
      handleGenerate()
      return
    }
    const blob = new Blob([reportHtml], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reporte-terceros_${new Date().toISOString().slice(0, 10)}.html`
    a.click()
    URL.revokeObjectURL(url)
    addToast('Reporte descargado')
  }

  const columns: Column<ThirdPartyReportRow>[] = [
    { key: 'orderId', header: 'OT', className: 'font-mono text-xs' },
    { key: 'client', header: 'Cliente' },
    { key: 'company', header: 'Empresa tercera', className: 'font-medium' },
    { key: 'detail', header: 'Detalle' },
    { key: 'registeredAt', header: 'Fecha' },
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Intervenciones de terceros"
          subtitle="CU-158: generar reporte · CU-159: filtrar intervenciones"
          action={
            <div className="flex flex-wrap gap-2">
              <Button leftIcon={<FileText className="h-4 w-4" />} onClick={handleGenerate}>
                Generar reporte
              </Button>
              <Button
                variant="outline"
                leftIcon={<Download className="h-4 w-4" />}
                onClick={handleDownload}
                disabled={filtered.length === 0}
              >
                Descargar
              </Button>
            </div>
          }
        />

        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="min-w-[200px] flex-1">
            <Input
              placeholder="Buscar empresa, detalle u OT..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Building2 className="h-4 w-4" />}
            />
          </div>
          <div className="min-w-[180px]">
            <label className="mb-1.5 block text-xs font-medium text-slate-600">Empresa</label>
            <Select value={companyFilter} onChange={(e) => setCompanyFilter(e.target.value)}>
              <option value="all">Todas</option>
              {companies.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </div>
          <div className="min-w-[180px]">
            <label className="mb-1.5 block text-xs font-medium text-slate-600">Orden de trabajo</label>
            <Select value={orderFilter} onChange={(e) => setOrderFilter(e.target.value)}>
              <option value="all">Todas</option>
              {orderOptions.map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {rows.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">
            No hay intervenciones de terceros registradas en órdenes de trabajo.
          </p>
        ) : filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">
            No hay registros con los filtros seleccionados.
          </p>
        ) : (
          <DataTable columns={columns} data={filtered} keyExtractor={(r) => r.id} />
        )}
      </Card>

      {reportHtml && (
        <Card className="overflow-hidden p-0">
          <div className="border-b border-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
            Vista previa del reporte
          </div>
          <iframe
            title="Vista previa reporte terceros"
            srcDoc={reportHtml}
            className="h-[420px] w-full border-0 bg-white"
          />
        </Card>
      )}
    </div>
  )
}
