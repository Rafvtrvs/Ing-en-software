import { useState } from 'react'
import { Download, FileText, Filter, Search } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { useReportsStore } from '@/store/useReportsStore'
import { useThirdPartyFilterDraft } from '@/features/reports/hooks/useThirdPartyFilterDraft'
import { buildThirdPartyReportHtml } from '@/features/reports/utils/buildThirdPartyReportHtml'
import type { ThirdPartyReportRow } from '@/types'

/** Reporte de intervenciones de terceros (filtrar + generar) */
export function ThirdPartyInterventionsReportPanel() {
  const addToast = useReportsStore((s) => s.addToast)
  const {
    rows,
    companies,
    orderOptions,
    draft,
    patchDraft,
    applyFilter,
    clearFilters,
    hasFiltered,
    filtered,
    rowsForReport,
  } = useThirdPartyFilterDraft()

  const [reportHtml, setReportHtml] = useState<string | null>(null)

  const handleGenerate = () => {
    if (rowsForReport.length === 0) {
      addToast('No hay intervenciones para el reporte. Aplique filtros o revise los datos.', 'error')
      return
    }
    setReportHtml(buildThirdPartyReportHtml(rowsForReport))
    addToast(`Reporte generado con ${rowsForReport.length} registro(s). Vea la vista previa abajo.`)
  }

  const handleDownload = () => {
    if (!reportHtml) {
      addToast('Primero pulse «Generar reporte»', 'error')
      return
    }
    const blob = new Blob([reportHtml], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reporte-terceros_${new Date().toISOString().slice(0, 10)}.html`
    a.click()
    URL.revokeObjectURL(url)
    addToast('Archivo HTML descargado')
  }

  const columns: Column<ThirdPartyReportRow>[] = [
    { key: 'orderId', header: 'OT', className: 'font-mono text-xs' },
    { key: 'client', header: 'Cliente' },
    { key: 'company', header: 'Empresa tercera', className: 'font-medium' },
    { key: 'detail', header: 'Detalle' },
    { key: 'registeredAt', header: 'Fecha' },
  ]

  const tableData = hasFiltered ? filtered : rows

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Intervenciones de terceros"
          subtitle="Filtre el listado y genere un reporte en formato HTML para descargar."
        />

        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="min-w-[200px] flex-1">
            <label className="mb-1.5 block text-xs font-medium text-slate-600">Búsqueda</label>
            <Input
              placeholder="Empresa, detalle, cliente u OT..."
              value={draft.search}
              onChange={(e) => patchDraft({ search: e.target.value })}
              icon={<Search className="h-4 w-4" />}
            />
          </div>
          <div className="min-w-[180px]">
            <label className="mb-1.5 block text-xs font-medium text-slate-600">Empresa</label>
            <Select
              value={draft.companyFilter}
              onChange={(e) => patchDraft({ companyFilter: e.target.value })}
            >
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
            <Select
              value={draft.orderFilter}
              onChange={(e) => patchDraft({ orderFilter: e.target.value })}
            >
              <option value="all">Todas</option>
              {orderOptions.map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button leftIcon={<Filter className="h-4 w-4" />} onClick={applyFilter}>
              Filtrar
            </Button>
            <Button variant="outline" onClick={clearFilters}>
              Limpiar
            </Button>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
          <p className="text-sm text-slate-600">
            Registros para el reporte: <strong className="text-slate-900">{rowsForReport.length}</strong>
          </p>
          <div className="flex flex-wrap gap-2">
            <Button leftIcon={<FileText className="h-4 w-4" />} onClick={handleGenerate}>
              Generar reporte
            </Button>
            <Button
              variant="outline"
              leftIcon={<Download className="h-4 w-4" />}
              onClick={handleDownload}
              disabled={!reportHtml}
            >
              Descargar HTML
            </Button>
          </div>
        </div>

        {rows.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">
            No hay intervenciones de terceros registradas en órdenes de trabajo.
          </p>
        ) : tableData.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">
            No hay registros con los filtros aplicados. Pulse Filtrar tras elegir criterios.
          </p>
        ) : (
          <DataTable columns={columns} data={tableData} keyExtractor={(r) => r.id} />
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
