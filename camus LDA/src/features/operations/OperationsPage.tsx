import { Calendar, Plus } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { KpiCard } from '@/components/ui/KpiCard'
import { ToastContainerView } from '@/components/ui/ToastContainer'
import { getOperationsKpis } from '@/data/mock/operations'
import { useOperationsStore } from '@/store/useOperationsStore'
import { formatDate } from '@/utils/formatters'
import { OperationsMap } from './components/OperationsMap'
import { TechniciansList } from './components/TechniciansList'
import { FieldAlerts } from './components/FieldAlerts'
import { DaySchedule } from './components/DaySchedule'
import { FieldOrdersTable } from './components/FieldOrdersTable'
import { MobileAppCard } from './components/MobileAppCard'

export function OperationsPage() {
  const toasts = useOperationsStore((s) => s.toasts)
  const removeToast = useOperationsStore((s) => s.removeToast)
  const addToast = useOperationsStore((s) => s.addToast)
  const kpis = getOperationsKpis()
  const today = formatDate(new Date())

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="Operaciones en Terreno"
          subtitle="Monitorea y gestiona las operaciones y técnicos en terreno en tiempo real."
          action={
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm">
                <Calendar className="h-4 w-4 text-slate-400" />
                {today}
              </div>
              <Button
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={() => addToast('Asignación de operación — próximamente', 'info')}
              >
                Asignar Operación
              </Button>
            </div>
          }
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {kpis.map((kpi) => (
            <KpiCard key={kpi.title} data={kpi} />
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <OperationsMap />
          <TechniciansList />
          <FieldAlerts />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <DaySchedule />
          <div className="lg:col-span-2">
            <FieldOrdersTable />
          </div>
        </div>

        <MobileAppCard />
      </div>

      <ToastContainerView toasts={toasts} onRemove={removeToast} />
    </>
  )
}
