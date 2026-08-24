import { Bell, LogOut, Menu } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store/useAppStore'
import { authService } from '@/services/authService'

export function Header() {
  const { user, toggleSidebar } = useAppStore()
  const navigate = useNavigate()
  const authUser = authService.getUser()

  const handleLogout = () => {
    authService.logout()
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
        <button
          type="button"
          className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100"
          aria-label="Notificaciones"
        >
          <Bell className="h-5 w-5" />
          {user.notifications > 0 && (
            <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {user.notifications}
            </span>
          )}
        </button>

        <div className="flex items-center gap-3 rounded-lg py-1.5 pl-1.5 pr-2">
          <img
            src={user.avatar}
            alt={authUser?.name ?? user.name}
            className="h-9 w-9 rounded-full bg-slate-100 object-cover ring-2 ring-slate-100"
          />
          <div className="hidden text-left sm:block">
            <p className="text-sm font-semibold text-slate-900">
              {authUser?.name ?? user.name}
            </p>
            <p className="text-xs text-slate-500">
              {authUser?.role ?? user.role}
            </p>
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
