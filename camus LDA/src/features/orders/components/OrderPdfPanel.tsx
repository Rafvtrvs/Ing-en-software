import { Download, FileText, Printer, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useOrdersStore } from '@/store/useOrdersStore'
import {
  downloadOrderPdf,
  previewOrderPdf,
  printOrderPdf,
} from '@/features/orders/utils/orderPdf'
import type { OrderIntervention, WorkOrder } from '@/types'

const EMPTY_INTERVENTIONS: OrderIntervention[] = []

/** CU-173–176: preview, descarga y regeneración de resumen OT */
export function OrderPdfPanel({ order }: { order: WorkOrder }) {
  const interventions = useOrdersStore(
    (s) => s.interventionsByOrderId[order.id] ?? EMPTY_INTERVENTIONS,
  )
  const markPdfGenerated = useOrdersStore((s) => s.markPdfGenerated)
  const addToast = useOrdersStore((s) => s.addToast)

  const run = (action: 'preview' | 'download' | 'print' | 'regenerate') => {
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
            PDF / resumen de OT
          </p>
          <p className="text-xs text-slate-500">
            Vista previa, descarga e impresión sin librerías externas
          </p>
        </div>
      </div>
      {order.pdfGeneratedAt && (
        <p className="mb-2 text-xs text-slate-500">
          Última generación:{' '}
          {new Date(order.pdfGeneratedAt).toLocaleString('es-CL')}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          leftIcon={<FileText className="h-4 w-4" />}
          onClick={() => run('preview')}
        >
          Vista previa
        </Button>
        <Button
          type="button"
          variant="outline"
          leftIcon={<Download className="h-4 w-4" />}
          onClick={() => run('download')}
        >
          Descargar
        </Button>
        <Button
          type="button"
          variant="outline"
          leftIcon={<Printer className="h-4 w-4" />}
          onClick={() => run('print')}
        >
          Imprimir
        </Button>
        <Button
          type="button"
          leftIcon={<RefreshCw className="h-4 w-4" />}
          onClick={() => run('regenerate')}
        >
          Regenerar
        </Button>
      </div>
    </div>
  )
}
