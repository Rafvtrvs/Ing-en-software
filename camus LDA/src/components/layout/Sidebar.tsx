import { NavLink } from 'react-router-dom'
import { NAV_SECTIONS, SUPPORT_ITEM } from '@/constants/navigation'
import { cn } from '@/utils/cn'
import { useAppStore } from '@/store/useAppStore'
import { useSessionUser } from '@/features/auth/useSessionUser'
import { canAccessPath } from '@/features/auth/roleAccess'
import { UserAvatar } from './UserAvatar'

function navItemClass(isActive: boolean) {
  return cn(
    'flex items-center gap-3 rounded-lg border-l-[3px] px-3 py-2.5 text-sm font-medium transition-colors',
    isActive
      ? 'border-primary bg-white/10 text-white'
      : 'border-transparent text-slate-300 hover:bg-white/5 hover:text-white',
  )
}

export function Sidebar() {
  const sidebarOpen = useAppStore((s) => s.sidebarOpen)
  const user = useSessionUser()

  const sections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => canAccessPath(user, item.path)),
  })).filter((section) => section.items.length > 0)

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-sidebar text-white transition-transform duration-300',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
      )}
    >
      <div className="px-5 pb-3 pt-5">
        <img
          src="/images/logo-camus-sidebar.png"
          alt="Alcantarillados Camus Ltda."
          className="mx-auto h-auto w-full max-w-[188px] object-contain"
        />
      </div>

      <nav
        className="scrollbar-thin flex-1 overflow-y-auto px-3 py-2"
        aria-label="Menú principal"
      >
        {sections.length === 0 ? (
          <p className="px-3 text-xs text-slate-400">
            No hay secciones disponibles para tu rol.
          </p>
        ) : (
          sections.map((section, idx) => (
            <div key={idx} className={cn(idx > 0 && 'mt-6')}>
              {section.title && (
                <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                  {section.title}
                </p>
              )}
              <ul className="space-y-0.5">
                {section.items.map((item) => (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      end={item.path === '/'}
                      className={({ isActive }) => navItemClass(isActive)}
                    >
                      <item.icon className="h-5 w-5 shrink-0 opacity-90" />
                      <span className="truncate">{item.label}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </nav>

      <div className="space-y-1 border-t border-white/10 p-3">
        <div className="flex items-center gap-3 px-3 py-2">
          <UserAvatar className="bg-white/10 text-white" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">{user.name}</p>
            <p className="truncate text-xs text-slate-400">{user.role || 'Sin rol'}</p>
          </div>
        </div>
        <NavLink
          to={SUPPORT_ITEM.path}
          className={({ isActive }) => navItemClass(isActive)}
        >
          <SUPPORT_ITEM.icon className="h-5 w-5" />
          {SUPPORT_ITEM.label}
        </NavLink>
      </div>
    </aside>
  )
}
