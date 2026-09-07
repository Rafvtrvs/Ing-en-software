import { Download } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Tabs } from '@/components/ui/Tabs'
import { ToastContainerView } from '@/components/ui/ToastContainer'
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
import { ReportPeriodSelect } from './components/ReportPeriodSelect'
import { SummaryReportPanel } from './components/SummaryReportPanel'
import { OrdersReportPanel } from './components/OrdersReportPanel'
import { InventoryReportPanel } from './components/InventoryReportPanel'
import { BillingReportPanel } from './components/BillingReportPanel'
import { TechniciansReportPanel } from './components/TechniciansReportPanel'

const REPORT_TABS: { id: ReportTab; label: string }[] = [
  { id: 'resumen', label: 'Resumen' },
  { id: 'ordenes', label: 'Órdenes' },
  { id: 'inventario', label: 'Inventario' },
  { id: 'facturacion', label: 'Facturación' },
  { id: 'tecnicos', label: 'Técnicos' },
]

export function ReportsPage() {
  const activeTab = useReportsStore((s) => s.activeTab)
  const setActiveTab = useReportsStore((s) => s.setActiveTab)
  const addToast = useReportsStore((s) => s.addToast)
  const toasts = useReportsStore((s) => s.toasts)
  const removeToast = useReportsStore((s) => s.removeToast)

  const orders = useOrdersStore((s) => s.orders)
  const invoices = useBillingStore((s) => s.invoices)
  const products = useInventoryStore((s) => s.products)
  const clients = useClientsStore((s) => s.clients)

  const handleExportAll = () => {
    exportOrdersReport(orders)
    exportInvoicesReport(invoices)
    exportInventoryReport(products)
    exportTechniciansReport(technicianPerformance)
    exportClientsReport(clients)
    addToast('Paquete de reportes CSV descargado correctamente')
  }

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="Reportes"
          subtitle="Visualiza y analiza el rendimiento de la empresa con reportes detallados."
          action={
            <div className="flex flex-wrap items-center gap-3">
              <ReportPeriodSelect className="w-44" />
              <Button
                variant="outline"
                leftIcon={<Download className="h-4 w-4" />}
                onClick={handleExportAll}
              >
                Exportar todo
              </Button>
            </div>
          }
        />

        <Tabs tabs={REPORT_TABS} active={activeTab} onChange={setActiveTab} />

        {activeTab === 'resumen' && <SummaryReportPanel />}
        {activeTab === 'ordenes' && <OrdersReportPanel />}
        {activeTab === 'inventario' && <InventoryReportPanel />}
        {activeTab === 'facturacion' && <BillingReportPanel />}
        {activeTab === 'tecnicos' && <TechniciansReportPanel />}
      </div>

      <ToastContainerView toasts={toasts} onRemove={removeToast} />
    </>
  )
}
