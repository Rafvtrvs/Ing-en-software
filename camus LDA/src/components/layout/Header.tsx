import { LogOut, Menu } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store/useAppStore'
import { authService } from '@/services/authService'
import { useSessionUser } from '@/features/auth/useSessionUser'
import { findSectionLabel } from '@/constants/navigation'
import { NotificationsPanel } from '@/components/layout/NotificationsPanel'
import { UserAvatar } from './UserAvatar'

export function Header() {
  const toggleSidebar = useAppStore((s) => s.toggleSidebar)
  const setUser = useAppStore((s) => s.setUser)
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const session = useSessionUser()
  const section = findSectionLabel(pathname)

  const handleLogout = () => {
    authService.logout()
    setUser({
      name: 'Invitado',
      role: '',
      avatar: '',
    })
    navigate('/login', { replace: true })
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white px-4 dark:border-slate-700 dark:bg-slate-900 lg:px-6">
      <button
        type="button"
        onClick={toggleSidebar}
        className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
        aria-label="Alternar menú"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
          {section}
        </p>
        <p className="hidden truncate text-xs text-slate-500 sm:block">
          Alcantarillados Camus Ltda.
        </p>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <NotificationsPanel />

        <div className="flex items-center gap-3">
          <UserAvatar />
          <div className="hidden text-left sm:block">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {session.name}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {session.role || 'Sin rol'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          aria-label="Cerrar sesión"
          title="Cerrar sesión"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  )
}
