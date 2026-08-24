import { useEffect } from 'react'
import { Plus } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { KpiCard } from '@/components/ui/KpiCard'
import { ToastContainerView } from '@/components/ui/ToastContainer'
import { useClientsStore } from '@/store/useClientsStore'
import { getClientsKpis } from '@/features/clients/utils/clientStats'
import { ClientsTable } from './components/ClientsTable'
import { ClientsSummaryChart } from './components/ClientsSummaryChart'
import { RecentOrdersByClient } from './components/RecentOrdersByClient'
import { UpcomingDeadlines } from './components/UpcomingDeadlines'
import { ClientFormModal } from './components/ClientFormModal'
import { ClientViewModal } from './components/ClientViewModal'
import { DeleteClientModal } from './components/DeleteClientModal'

export function ClientsPage() {
  const clients = useClientsStore((s) => s.clients)
  const modalMode = useClientsStore((s) => s.modalMode)
  const selectedClient = useClientsStore((s) => s.selectedClient)
  const openCreateModal = useClientsStore((s) => s.openCreateModal)
  const closeModal = useClientsStore((s) => s.closeModal)
  const toasts = useClientsStore((s) => s.toasts)
  const removeToast = useClientsStore((s) => s.removeToast)
  const syncFromApi = useClientsStore((s) => s.syncFromApi)

  // Carga inicial desde el backend (PostgreSQL). Si no responde, se
  // mantienen los datos locales para no perder funcionalidad.
  useEffect(() => {
    void syncFromApi()
  }, [syncFromApi])

  const kpis = getClientsKpis(clients)

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="Gestión de Clientes"
          subtitle="Administra y consulta la información de los clientes de la empresa."
          action={
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreateModal}>
              Nuevo Cliente
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
            <ClientsTable onCreateClick={openCreateModal} />
          </div>
          <ClientsSummaryChart />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <RecentOrdersByClient />
          <UpcomingDeadlines />
        </div>
      </div>

      <ClientFormModal
        mode="create"
        open={modalMode === 'create'}
        onClose={closeModal}
      />
      <ClientFormModal
        mode="edit"
        client={selectedClient}
        open={modalMode === 'edit'}
        onClose={closeModal}
      />
      <ClientViewModal
        client={selectedClient}
        open={modalMode === 'view'}
        onClose={closeModal}
      />
      <DeleteClientModal
        client={selectedClient}
        open={modalMode === 'delete'}
        onClose={closeModal}
      />
      <ToastContainerView toasts={toasts} onRemove={removeToast} />
    </>
  )
}
