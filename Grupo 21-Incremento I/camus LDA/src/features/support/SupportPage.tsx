import { PageHeader } from '@/components/ui/PageHeader'
import { Tabs } from '@/components/ui/Tabs'
import { ToastContainerView } from '@/components/ui/ToastContainer'
import { useSupportStore } from '@/store/useSupportStore'
import type { SupportTab } from '@/types'
import { FaqPanel } from './components/FaqPanel'
import { SupportTicketsTable } from './components/SupportTicketsTable'
import { ContactSupportPanel } from './components/ContactSupportPanel'
import { SupportQuickLinks } from './components/SupportQuickLinks'

const SUPPORT_TABS: { id: SupportTab; label: string }[] = [
  { id: 'ayuda', label: 'Centro de Ayuda' },
  { id: 'tickets', label: 'Mis Tickets' },
  { id: 'contacto', label: 'Contactar' },
]

export function SupportPage() {
  const activeTab = useSupportStore((s) => s.activeTab)
  const setActiveTab = useSupportStore((s) => s.setActiveTab)
  const toasts = useSupportStore((s) => s.toasts)
  const removeToast = useSupportStore((s) => s.removeToast)

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="Soporte"
          subtitle="Centro de ayuda y contacto con soporte técnico."
        />

        <Tabs tabs={SUPPORT_TABS} active={activeTab} onChange={setActiveTab} />

        {activeTab === 'ayuda' && (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <FaqPanel />
            </div>
            <SupportQuickLinks />
          </div>
        )}

        {activeTab === 'tickets' && <SupportTicketsTable />}

        {activeTab === 'contacto' && <ContactSupportPanel />}
      </div>

      <ToastContainerView toasts={toasts} onRemove={removeToast} />
    </>
  )
}
