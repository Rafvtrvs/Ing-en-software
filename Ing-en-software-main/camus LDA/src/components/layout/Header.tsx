import { LogOut, Menu } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store/useAppStore'
import { authService } from '@/services/authService'
import { useSessionUser } from '@/features/auth/useSessionUser'
import { NotificationsPanel } from '@/components/layout/NotificationsPanel'

export function Header() {
  const toggleSidebar = useAppStore((s) => s.toggleSidebar)
  const setUser = useAppStore((s) => s.setUser)
  const navigate = useNavigate()
  const session = useSessionUser()

  const handleLogout = () => {
    authService.logout()
    setUser({
      name: 'Invitado',
      role: '',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Guest',
    })
    navigate('/login', { replace: true })
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-6">
      <button
        type="button"
        onClick={toggleSidebar}
        className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
        aria-label="Abrir menú"
      >
        <Menu className="h-5 w-5" />
      </button>

      <button
        type="button"
        onClick={toggleSidebar}
        className="hidden rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:block"
        aria-label="Alternar sidebar"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex flex-1 items-center justify-end gap-3 sm:gap-4">
        <NotificationsPanel />

        <div className="flex items-center gap-3 rounded-lg py-1.5 pl-1.5 pr-2">
          <img
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(session.name ?? 'user')}`}
            alt={session.name}
            className="h-9 w-9 rounded-full bg-slate-100 object-cover ring-2 ring-slate-100"
          />
          <div className="hidden text-left sm:block">
            <p className="text-sm font-semibold text-slate-900">{session.name}</p>
            <p className="text-xs text-slate-500">{session.role || 'Sin rol'}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
          aria-label="Cerrar sesión"
          title="Cerrar sesión"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  )
}
