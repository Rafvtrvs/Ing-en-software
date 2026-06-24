import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { Tabs } from '@/components/ui/Tabs'
import { ToastContainerView } from '@/components/ui/ToastContainer'
import { useSettingsStore } from '@/store/useSettingsStore'
import type { SettingsTab } from '@/types'
import { ProfileSettingsPanel } from './components/ProfileSettingsPanel'
import { AppearanceSettingsPanel } from './components/AppearanceSettingsPanel'
import { SecuritySettingsPanel } from './components/SecuritySettingsPanel'
import { SystemSettingsPanel } from './components/SystemSettingsPanel'

const SETTINGS_TABS: { id: SettingsTab; label: string }[] = [
  { id: 'perfil', label: 'Mi Perfil' },
  { id: 'apariencia', label: 'Apariencia' },
  { id: 'seguridad', label: 'Seguridad' },
  { id: 'sistema', label: 'Sistema' },
]

const VALID_TABS = SETTINGS_TABS.map((t) => t.id)

export function SettingsPage() {
  const activeTab = useSettingsStore((s) => s.activeTab)
  const setActiveTab = useSettingsStore((s) => s.setActiveTab)
  const toasts = useSettingsStore((s) => s.toasts)
  const removeToast = useSettingsStore((s) => s.removeToast)
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const tab = searchParams.get('tab') as SettingsTab | null
    if (tab && VALID_TABS.includes(tab)) {
      setActiveTab(tab)
    }
  }, [searchParams, setActiveTab])

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="Configuración"
          subtitle="Ajustes generales de la plataforma y tu cuenta."
        />

        <Tabs tabs={SETTINGS_TABS} active={activeTab} onChange={setActiveTab} />

        {activeTab === 'perfil' && <ProfileSettingsPanel />}
        {activeTab === 'apariencia' && <AppearanceSettingsPanel />}
        {activeTab === 'seguridad' && <SecuritySettingsPanel />}
        {activeTab === 'sistema' && <SystemSettingsPanel />}
      </div>

      <ToastContainerView toasts={toasts} onRemove={removeToast} />
    </>
  )
}
