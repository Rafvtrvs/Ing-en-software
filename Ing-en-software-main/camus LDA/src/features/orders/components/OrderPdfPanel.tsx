import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileText,
  Printer,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useOrdersStore } from '@/store/useOrdersStore'
import {
  downloadOrderPdf,
  previewOrderPdf,
  printOrderPdf,
} from '@/features/orders/utils/orderPdf'
import { canGenerateServiceSummary } from '@/features/orders/utils/validateServiceSummary'
import type { OrderIntervention, WorkOrder } from '@/types'

const EMPTY_INTERVENTIONS: OrderIntervention[] = []

/**
 * CU-173–176: preview / descarga / regeneración
 * CU-177: validar datos obligatorios antes de habilitar el PDF
 */
export function OrderPdfPanel({ order }: { order: WorkOrder }) {
  const interventions = useOrdersStore(
    (s) => s.interventionsByOrderId[order.id] ?? EMPTY_INTERVENTIONS,
  )
  const markPdfGenerated = useOrdersStore((s) => s.markPdfGenerated)
  const addToast = useOrdersStore((s) => s.addToast)

  const [checked, setChecked] = useState(false)
  const [alertMissing, setAlertMissing] = useState<string[] | null>(null)
  const [readyMessage, setReadyMessage] = useState(false)

  const validation = useMemo(
    () => canGenerateServiceSummary(order, interventions),
    [order, interventions],
  )

  /** Si la OT cambia y deja de cumplir, deshabilita de nuevo el PDF */
  const pdfEnabled = checked && validation.ok

  const handleValidateSummary = () => {
    setChecked(true)

    if (!validation.finished) {
      setAlertMissing(null)
      setReadyMessage(false)
      addToast(
        'La orden debe estar en estado Completada (Finalizada) para generar el resumen.',
        'error',
      )
      return
    }

    if (validation.missing.length > 0) {
      setAlertMissing(validation.missing)
      setReadyMessage(false)
      addToast(
        'Faltan datos obligatorios. Completa los campos indicados antes de generar el PDF.',
        'error',
      )
      return
    }

    setAlertMissing(null)
    setReadyMessage(true)
    addToast('La orden ya cumple con los datos requeridos.', 'success')
    previewOrderPdf(order, interventions)
  }

  const run = (action: 'preview' | 'download' | 'print' | 'regenerate') => {
    if (!pdfEnabled) {
      handleValidateSummary()
      return
    }

    if (action === 'preview') {
      previewOrderPdf(order, interventions)
      addToast('Vista previa del resumen abierta', 'info')
    } else if (action === 'download') {
      downloadOrderPdf(order, interventions)
      markPdfGenerated(order.id)
      addToast('Resumen descargado (HTML imprimible)')
    } else if (action === 'print') {
      printOrderPdf(order, interventions)
      markPdfGenerated(order.id)
      addToast('Diálogo de impresión abierto', 'info')
    } else {
      previewOrderPdf(order, interventions)
      markPdfGenerated(order.id)
      addToast('Resumen regenerado')
    }
  }

  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <FileText className="h-4 w-4 text-slate-400" />
        <div>
          <p className="text-sm font-semibold text-slate-900">
            PDF / resumen de servicio
          </p>
          <p className="text-xs text-slate-500">
            Valida datos obligatorios antes de habilitar el PDF
          </p>
        </div>
      </div>

      {!validation.finished && (
        <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          La orden debe estar en estado <strong>Completada</strong> (Finalizada)
          para solicitar el resumen.
        </div>
      )}

      {alertMissing && alertMissing.length > 0 && (
        <div
          role="alert"
          className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900"
        >
          <div className="mb-1 flex items-center gap-2 font-semibold">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Campos obligatorios pendientes
          </div>
          <p className="mb-1 text-xs text-red-800">
            Completa la información y vuelve a solicitar el resumen:
          </p>
          <ul className="list-inside list-disc text-xs">
            {alertMissing.map((label) => (
              <li key={label}>{label}</li>
            ))}
          </ul>
        </div>
      )}

      {readyMessage && pdfEnabled && (
        <div className="mb-3 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            La orden ya cumple con los datos requeridos. El botón{' '}
            <strong>Generar PDF</strong> está habilitado.
          </span>
        </div>
      )}

      {order.pdfGeneratedAt && (
        <p className="mb-2 text-xs text-slate-500">
          Última generación:{' '}
          {new Date(order.pdfGeneratedAt).toLocaleString('es-CL')}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={handleValidateSummary}>
          Generar resumen de servicio
        </Button>
        <Button
          type="button"
          variant="outline"
          leftIcon={<FileText className="h-4 w-4" />}
          disabled={!pdfEnabled}
          onClick={() => run('preview')}
        >
          Generar PDF
        </Button>
        <Button
          type="button"
          variant="outline"
          leftIcon={<Download className="h-4 w-4" />}
          disabled={!pdfEnabled}
          onClick={() => run('download')}
        >
          Descargar
        </Button>
        <Button
          type="button"
          variant="outline"
          leftIcon={<Printer className="h-4 w-4" />}
          disabled={!pdfEnabled}
          onClick={() => run('print')}
        >
          Imprimir
        </Button>
        <Button
          type="button"
          leftIcon={<RefreshCw className="h-4 w-4" />}
          disabled={!pdfEnabled}
          onClick={() => run('regenerate')}
        >
          Regenerar
        </Button>
      </div>
    </div>
  )
}
