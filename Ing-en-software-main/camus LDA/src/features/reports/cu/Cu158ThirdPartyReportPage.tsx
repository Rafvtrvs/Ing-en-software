import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download, FileText } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { CuPageBanner } from '@/components/ui/CuPageBanner'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ToastContainerView } from '@/components/ui/ToastContainer'
import { ROUTES } from '@/constants/routes'
import { useThirdPartyFilterDraft } from '@/features/reports/hooks/useThirdPartyFilterDraft'
import { buildThirdPartyReportHtml } from '@/features/reports/utils/buildThirdPartyReportHtml'
import { useReportsStore } from '@/store/useReportsStore'

export function Cu158ThirdPartyReportPage() {
  const navigate = useNavigate()
  const { rowsForReport, hasFiltered } = useThirdPartyFilterDraft()
  const addToast = useReportsStore((s) => s.addToast)
  const toasts = useReportsStore((s) => s.toasts)
  const removeToast = useReportsStore((s) => s.removeToast)
  const [reportHtml, setReportHtml] = useState<string | null>(null)

  const handleGenerate = () => {
    if (rowsForReport.length === 0) {
      addToast('No hay datos para el reporte', 'error')
      return
    }
    setReportHtml(buildThirdPartyReportHtml(rowsForReport))
    addToast(`Reporte generado con ${rowsForReport.length} registro(s)`)
  }

  const handleDownload = () => {
    if (!reportHtml) {
      addToast('Genere el reporte antes de descargar', 'error')
      return
    }
    const blob = new Blob([reportHtml], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reporte-terceros_${new Date().toISOString().slice(0, 10)}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="Reportes"
          subtitle="Vista dedicada al caso de uso CU-158."
          action={
            <Button variant="outline" onClick={() => navigate(ROUTES.CU159)}>
              Ir a CU-159 — Filtrar
            </Button>
          }
        />

        <CuPageBanner
          rf="RF47"
          rfTitle="Reporte de intervenciones de terceros"
          cu="CU-158"
          cuTitle="Generar reporte de intervenciones de terceros"
        />

        <Card className="p-6">
          <div className="mb-4 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <p className="font-medium">¿Cómo funciona?</p>
            <ol className="mt-2 list-decimal space-y-1 pl-4">
              <li>En CU-159 elija criterios y pulse <strong>Filtrar</strong> (opcional).</li>
              <li>
                Aquí pulse <strong>Generar reporte</strong>: se arma un HTML con la tabla de{' '}
                <strong>{rowsForReport.length}</strong> fila(s)
                {hasFiltered ? ' (filtro aplicado)' : ' (todas las intervenciones)'}.
              </li>
              <li>Aparece la vista previa debajo; use <strong>Descargar HTML</strong> para guardar el archivo.</li>
            </ol>
          </div>
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
          {reportHtml && (
            <iframe
              title="Vista previa CU-158"
              className="mt-4 h-72 w-full rounded-lg border border-slate-200 bg-white sm:h-96"
              srcDoc={reportHtml}
            />
          )}
        </Card>
      </div>
      <ToastContainerView toasts={toasts} onRemove={removeToast} />
    </>
  )
}
