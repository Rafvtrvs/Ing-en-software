import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { Footer } from './Footer'
import { ConnectivityBanner } from './ConnectivityBanner'
import { MobileFormsMode } from './MobileFormsMode'
import { useAppStore } from '@/store/useAppStore'
import { RequirePermission } from '@/components/auth/RequirePermission'
import { useSessionUser } from '@/features/auth/useSessionUser'
import { isFieldOperator } from '@/features/auth/roleAccess'
import { useIsMobileViewport } from '@/hooks/useIsMobileViewport'
import { FieldMobilePage } from '@/features/field/FieldMobilePage'
import { cn } from '@/utils/cn'

export function AppLayout() {
  const sidebarOpen = useAppStore((s) => s.sidebarOpen)
  const setSidebarOpen = useAppStore((s) => s.setSidebarOpen)
  const user = useSessionUser()
  const isMobile = useIsMobileViewport()

  // PC: menú lateral visible. Móvil: cerrado (hamburguesa).
  useEffect(() => {
    if (isFieldOperator(user)) return
    setSidebarOpen(!isMobile)
  }, [isMobile, user, setSidebarOpen])

  if (isFieldOperator(user) && isMobile) {
    return <FieldMobilePage />
  }

  return (
    <div className="min-h-screen overflow-x-auto bg-surface text-slate-800 dark:text-slate-100">
      <MobileFormsMode />
      <Sidebar />

      <div
        className={cn(
          'flex min-h-screen min-w-0 flex-col transition-[margin] duration-300',
          // En PC el margen acompaña al sidebar (no depende solo de lg:)
          isMobile ? 'ml-0 w-full' : sidebarOpen ? 'ml-64' : 'ml-0',
        )}
      >
        <Header />
        <ConnectivityBanner />
        <main
          className={cn(
            'mx-auto flex w-full min-w-0 max-w-[1440px] flex-1 flex-col',
            isMobile ? 'px-4 py-5' : 'px-6 py-6 xl:px-8',
          )}
        >
          <RequirePermission>
            <div className="min-w-0 flex-1">
              <Outlet />
            </div>
          </RequirePermission>
          <Footer />
        </main>
      </div>

      {sidebarOpen && isMobile && (
        <div
          className="fixed inset-0 z-30 bg-black/40"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}
    </div>
  )
}
