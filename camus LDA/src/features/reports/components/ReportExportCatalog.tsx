import { Download, FileSpreadsheet, FileText } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { reportExportCatalog } from '@/data/mock/reports'
import { useReportsStore } from '@/store/useReportsStore'
import { useOrdersStore } from '@/store/useOrdersStore'
import { useBillingStore } from '@/store/useBillingStore'
import { useInventoryStore } from '@/store/useInventoryStore'
import { useClientsStore } from '@/store/useClientsStore'
import { technicianPerformance } from '@/data/mock/reports'
import { mockEquipment } from '@/data/mock/equipment'
import {
  exportAssetsPdf,
  exportClientsReport,
  exportCostsPdf,
  exportExecutiveSummaryPdf,
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
    const asExcel = format === 'XLSX'

    switch (id) {
      case 'exp-1':
      case 'exp-1x':
        exportOrdersReport(orders, asExcel ? 'XLSX' : 'CSV')
        break
      case 'exp-2':
      case 'exp-2x':
        exportInvoicesReport(invoices, asExcel ? 'XLSX' : 'CSV')
        break
      case 'exp-3':
      case 'exp-3x':
        exportInventoryReport(products, asExcel ? 'XLSX' : 'CSV')
        break
      case 'exp-4':
      case 'exp-4x':
        exportTechniciansReport(technicianPerformance, asExcel ? 'XLSX' : 'CSV')
        break
      case 'exp-6':
      case 'exp-6x':
        exportClientsReport(clients, asExcel ? 'XLSX' : 'CSV')
        break
      case 'exp-5': {
        const completed = orders.filter((o) => o.status === 'Completada' || o.status === 'Abonado').length
        exportExecutiveSummaryPdf({
          totalOrders: orders.length,
          completedOrders: completed,
          totalRevenue: invoices.reduce((sum, inv) => sum + inv.amount, 0),
          criticalProducts: products.filter((p) => p.status === 'Crítico').length,
          activeClients: clients.filter((c) => c.status === 'Activo').length,
        })
        break
      }
      case 'exp-7': {
        const labor = Math.round(orders.length * 45000)
        const fuel = Math.round(orders.length * 18000)
        const overhead = Math.round((labor + fuel) * 0.15)
        exportCostsPdf([
          `Ordenes consideradas: ${orders.length}`,
          `Mano de obra estimada: $${labor.toLocaleString('es-CL')}`,
          `Combustible estimado: $${fuel.toLocaleString('es-CL')}`,
          `Overhead (15%): $${overhead.toLocaleString('es-CL')}`,
          `Total estimado: $${(labor + fuel + overhead).toLocaleString('es-CL')}`,
        ])
        break
      }
      case 'exp-8': {
        const lines = mockEquipment.map((eq) => {
          const linked = orders.filter((o) => o.equipmentId === eq.id || o.truckCode === eq.code)
          return `${eq.code} — ${eq.name}: ${linked.length} OT · estado ${eq.status}`
        })
        exportAssetsPdf(lines)
        break
      }
      default:
        addToast(`Exportación de "${title}" — próximamente`, 'info')
        return
    }

    addToast(`"${title}" descargado (${format})`)
  }

  return (
    <Card>
      <CardHeader
        title="Exportar Reportes"
        subtitle="Descargas reales en CSV, Excel (.xlsx) o PDF."
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
                ) : item.format === 'XLSX' ? (
                  <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
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
                      : item.format === 'XLSX'
                        ? 'bg-emerald-50 text-emerald-700'
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
