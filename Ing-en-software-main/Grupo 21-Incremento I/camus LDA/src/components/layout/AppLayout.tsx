import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { Footer } from './Footer'
import { useAppStore } from '@/store/useAppStore'
import { cn } from '@/utils/cn'

export function AppLayout() {
  const sidebarOpen = useAppStore((s) => s.sidebarOpen)

  return (
    <div className="min-h-screen bg-surface">
      <Sidebar />

      <div
        className={cn(
          'flex min-h-screen flex-col transition-[margin] duration-300',
          sidebarOpen ? 'lg:ml-64' : 'lg:ml-0',
        )}
      >
        <Header />
        <main className="flex flex-1 flex-col px-4 py-6 lg:px-8">
          <Outlet />
          <Footer />
        </main>
      </div>

      {/* Overlay sidebar móvil */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => useAppStore.getState().setSidebarOpen(false)}
          aria-hidden
        />
      )}
    </div>
  )
}
