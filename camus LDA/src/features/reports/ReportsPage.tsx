import { useEffect } from 'react'
import { Download } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
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
import { exportAllReportsPackage } from '@/features/reports/utils/exportReports'
import type { ReportTab } from '@/types'
import { ReportPeriodSelect } from './components/ReportPeriodSelect'
import { SummaryReportPanel } from './components/SummaryReportPanel'
import { OrdersReportPanel } from './components/OrdersReportPanel'
import { InventoryReportPanel } from './components/InventoryReportPanel'
import { BillingReportPanel } from './components/BillingReportPanel'
import { CostsReportPanel } from './components/CostsReportPanel'
import { TechniciansReportPanel } from './components/TechniciansReportPanel'
import { AuditReportPanel } from './components/AuditReportPanel'
import { ServiceTimesReportPanel } from './components/ServiceTimesReportPanel'
import { UtilityReportPanel } from './components/UtilityReportPanel'
import { AccessLogReportPanel } from './components/AccessLogReportPanel'
import { ThirdPartyInterventionsReportPanel } from './components/ThirdPartyInterventionsReportPanel'
import { TraceabilityReportPanel } from './components/TraceabilityReportPanel'
import { PhysicalAssetsReportPanel } from './components/PhysicalAssetsReportPanel'

const REPORT_TABS: { id: ReportTab; label: string }[] = [
  { id: 'resumen', label: 'Resumen' },
  { id: 'ordenes', label: 'Órdenes' },
  { id: 'inventario', label: 'Inventario' },
  { id: 'facturacion', label: 'Facturación' },
  { id: 'utilidad', label: 'Utilidad' },
  { id: 'trazabilidad', label: 'Trazabilidad' },
  { id: 'activos', label: 'Activos físicos' },
  { id: 'costos', label: 'Costos' },
  { id: 'tecnicos', label: 'Técnicos' },
  { id: 'tiempos', label: 'Tiempos de operación' },
  { id: 'terceros', label: 'Terceros' },
  { id: 'accesos', label: 'Accesos' },
  { id: 'auditoria', label: 'Auditoría' },
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
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const tab = searchParams.get('tab') as ReportTab | null
    if (tab && REPORT_TABS.some((t) => t.id === tab)) {
      setActiveTab(tab)
    }
  }, [searchParams, setActiveTab])

  const handleExportAll = () => {
    try {
      exportAllReportsPackage({
        orders,
        invoices,
        products,
        technicians: technicianPerformance,
        clients,
      })
      addToast('Descargado: reporte-completo.xlsx (Órdenes, Facturas, Inventario, Técnicos, Clientes)')
    } catch (err) {
      console.error(err)
      addToast('No se pudo generar el reporte completo', 'error')
    }
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
        {activeTab === 'utilidad' && <UtilityReportPanel />}
        {activeTab === 'trazabilidad' && <TraceabilityReportPanel />}
        {activeTab === 'activos' && <PhysicalAssetsReportPanel />}
        {activeTab === 'costos' && <CostsReportPanel />}
        {activeTab === 'tecnicos' && <TechniciansReportPanel />}
        {activeTab === 'tiempos' && <ServiceTimesReportPanel />}
        {activeTab === 'terceros' && <ThirdPartyInterventionsReportPanel />}
        {activeTab === 'accesos' && <AccessLogReportPanel />}
        {activeTab === 'auditoria' && <AuditReportPanel />}
      </div>

      <ToastContainerView toasts={toasts} onRemove={removeToast} />
    </>
  )
}
