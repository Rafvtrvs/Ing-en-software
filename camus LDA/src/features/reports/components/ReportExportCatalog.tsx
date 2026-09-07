import { Download, FileText } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { reportExportCatalog } from '@/data/mock/reports'
import { useReportsStore } from '@/store/useReportsStore'
import { useOrdersStore } from '@/store/useOrdersStore'
import { useBillingStore } from '@/store/useBillingStore'
import { useInventoryStore } from '@/store/useInventoryStore'
import { useClientsStore } from '@/store/useClientsStore'
import { technicianPerformance } from '@/data/mock/reports'
import {
  exportClientsReport,
  exportInventoryReport,
  exportInvoicesReport,
  exportOrdersReport,
  exportTechniciansReport,
} from '@/features/reports/utils/exportReports'
import type { ReportTab } from '@/types'
import { cn } from '@/utils/cn'

interface ReportExportCatalogProps {
  filterTab?: ReportTab
}

export function ReportExportCatalog({ filterTab }: ReportExportCatalogProps) {
  const addToast = useReportsStore((s) => s.addToast)
  const orders = useOrdersStore((s) => s.orders)
  const invoices = useBillingStore((s) => s.invoices)
  const products = useInventoryStore((s) => s.products)
  const clients = useClientsStore((s) => s.clients)

  const items = filterTab
    ? reportExportCatalog.filter((item) => item.category === filterTab)
    : reportExportCatalog

  const handleExport = (id: string, title: string, format: string) => {
    if (format === 'PDF') {
      const content = `Reporte: ${title}\nGenerado: ${new Date().toLocaleString('es-CL')}\n\nDocumento de demostración — Camus LDA\n`
      const blob = new Blob([content], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${title.replace(/\s+/g, '_').toLowerCase()}_demo.pdf`
      link.click()
      URL.revokeObjectURL(url)
      addToast(`PDF de demostración "${title}" descargado`)
      return
    }

    switch (id) {
      case 'exp-1':
        exportOrdersReport(orders)
        break
      case 'exp-2':
        exportInvoicesReport(invoices)
        break
      case 'exp-3':
        exportInventoryReport(products)
        break
      case 'exp-4':
        exportTechniciansReport(technicianPerformance)
        break
      case 'exp-6':
        exportClientsReport(clients)
        break
      default:
        addToast(`Exportación de "${title}" — próximamente`, 'info')
        return
    }
    addToast(`"${title}" exportado correctamente`)
  }

  return (
    <Card>
      <CardHeader
        title="Exportar Reportes"
        subtitle="Descarga datos en CSV o genera documentos PDF."
      />
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-4"
          >
            <div className="flex min-w-0 gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
                {item.format === 'PDF' ? (
                  <FileText className="h-5 w-5 text-red-500" />
                ) : (
                  <Download className="h-5 w-5 text-primary" />
                )}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-slate-900">{item.title}</p>
                <p className="mt-0.5 text-xs text-slate-500">{item.description}</p>
                <span
                  className={cn(
                    'mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium',
                    item.format === 'PDF'
                      ? 'bg-red-50 text-red-600'
                      : 'bg-blue-50 text-blue-600',
                  )}
                >
                  {item.format}
                </span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport(item.id, item.title, item.format)}
            >
              Exportar
            </Button>
          </div>
        ))}
      </div>
    </Card>
  )
}
