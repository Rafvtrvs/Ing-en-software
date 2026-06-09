import { Plus } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { KpiCard } from '@/components/ui/KpiCard'
import { ToastContainerView } from '@/components/ui/ToastContainer'
import { useBillingStore } from '@/store/useBillingStore'
import { getBillingKpis } from '@/data/mock/billing'
import { InvoicesTable } from './components/InvoicesTable'
import { BillingSummaryChart } from './components/BillingSummaryChart'
import { UpcomingInvoices } from './components/UpcomingInvoices'
import { RecentPayments } from './components/RecentPayments'
import { InvoiceFormModal } from './components/InvoiceFormModal'
import { InvoiceViewModal } from './components/InvoiceViewModal'
import { DeleteInvoiceModal } from './components/DeleteInvoiceModal'

export function BillingPage() {
  const invoices = useBillingStore((s) => s.invoices)
  const modalMode = useBillingStore((s) => s.modalMode)
  const selectedInvoice = useBillingStore((s) => s.selectedInvoice)
  const openCreateModal = useBillingStore((s) => s.openCreateModal)
  const closeModal = useBillingStore((s) => s.closeModal)
  const toasts = useBillingStore((s) => s.toasts)
  const removeToast = useBillingStore((s) => s.removeToast)

  const kpis = getBillingKpis(invoices)

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="Facturación"
          subtitle="Gestiona y controla la facturación, pagos y vencimientos."
          action={
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreateModal}>
              Nueva Factura
            </Button>
          }
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((kpi) => (
            <KpiCard key={kpi.title} data={kpi} />
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <InvoicesTable onCreateClick={openCreateModal} />
          </div>
          <BillingSummaryChart />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <UpcomingInvoices />
          <RecentPayments />
        </div>
      </div>

      <InvoiceFormModal mode="create" open={modalMode === 'create'} onClose={closeModal} />
      <InvoiceFormModal
        mode="edit"
        invoice={selectedInvoice}
        open={modalMode === 'edit'}
        onClose={closeModal}
      />
      <InvoiceViewModal
        invoice={selectedInvoice}
        open={modalMode === 'view'}
        onClose={closeModal}
      />
      <DeleteInvoiceModal
        invoice={selectedInvoice}
        open={modalMode === 'delete'}
        onClose={closeModal}
      />

      <ToastContainerView toasts={toasts} onRemove={removeToast} />
    </>
  )
}
