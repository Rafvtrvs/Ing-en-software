import { RotateCcw } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Tabs } from '@/components/ui/Tabs'
import { ToastContainerView } from '@/components/ui/ToastContainer'
import { useParametersStore } from '@/store/useParametersStore'
import type { ParametersTab } from '@/types'
import { GeneralSettingsPanel } from './components/GeneralSettingsPanel'
import { OrdersSettingsPanel } from './components/OrdersSettingsPanel'
import { BillingSettingsPanel } from './components/BillingSettingsPanel'
import { InventorySettingsPanel } from './components/InventorySettingsPanel'
import { NotificationsSettingsPanel } from './components/NotificationsSettingsPanel'
import { OperationsSettingsPanel } from './components/OperationsSettingsPanel'

const PARAMETER_TABS: { id: ParametersTab; label: string }[] = [
  { id: 'general', label: 'General' },
  { id: 'ordenes', label: 'Órdenes' },
  { id: 'facturacion', label: 'Facturación' },
  { id: 'inventario', label: 'Inventario' },
  { id: 'notificaciones', label: 'Notificaciones' },
  { id: 'operaciones', label: 'Operaciones' },
]

export function ParametersPage() {
  const activeTab = useParametersStore((s) => s.activeTab)
  const setActiveTab = useParametersStore((s) => s.setActiveTab)
  const resetToDefaults = useParametersStore((s) => s.resetToDefaults)
  const addToast = useParametersStore((s) => s.addToast)
  const toasts = useParametersStore((s) => s.toasts)
  const removeToast = useParametersStore((s) => s.removeToast)

  const handleReset = () => {
    if (window.confirm('¿Restaurar todos los parámetros a los valores por defecto?')) {
      resetToDefaults()
      addToast('Parámetros restaurados a valores por defecto', 'info')
    }
  }

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="Parámetros"
          subtitle="Configura parámetros operativos del sistema."
          action={
            <Button
              variant="outline"
              leftIcon={<RotateCcw className="h-4 w-4" />}
              onClick={handleReset}
            >
              Restaurar valores
            </Button>
          }
        />

        <Tabs tabs={PARAMETER_TABS} active={activeTab} onChange={setActiveTab} />

        {activeTab === 'general' && <GeneralSettingsPanel />}
        {activeTab === 'ordenes' && <OrdersSettingsPanel />}
        {activeTab === 'facturacion' && <BillingSettingsPanel />}
        {activeTab === 'inventario' && <InventorySettingsPanel />}
        {activeTab === 'notificaciones' && <NotificationsSettingsPanel />}
        {activeTab === 'operaciones' && <OperationsSettingsPanel />}
      </div>

      <ToastContainerView toasts={toasts} onRemove={removeToast} />
    </>
  )
}
