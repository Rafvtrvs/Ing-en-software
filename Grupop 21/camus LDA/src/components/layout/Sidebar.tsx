import { NavLink } from 'react-router-dom'
import { NAV_SECTIONS, SUPPORT_ITEM } from '@/constants/navigation'
import { cn } from '@/utils/cn'
import { useAppStore } from '@/store/useAppStore'

export function Sidebar() {
  const sidebarOpen = useAppStore((s) => s.sidebarOpen)

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-sidebar text-white transition-transform duration-300',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
      )}
    >
      <div className="border-b border-white/10 px-4 py-4">
        <img
          src="/images/logo-camus.png"
          alt="Alcantarillados Camus Ltda."
          className="mx-auto h-auto w-full max-w-[200px] rounded-lg bg-white object-contain p-1.5"
        />
      </div>

      <nav className="scrollbar-thin flex-1 overflow-y-auto px-3 py-4">
        {NAV_SECTIONS.map((section, idx) => (
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
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-sidebar-active text-white'
                          : 'text-slate-300 hover:bg-sidebar-hover hover:text-white',
                      )
                    }
                  >
                    <item.icon className="h-5 w-5 shrink-0 opacity-90" />
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 p-3">
        <NavLink
          to={SUPPORT_ITEM.path}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-lg border border-white/10 px-3 py-2.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-sidebar-active text-white'
                : 'text-slate-300 hover:bg-sidebar-hover hover:text-white',
            )
          }
        >
          <SUPPORT_ITEM.icon className="h-5 w-5" />
          {SUPPORT_ITEM.label}
        </NavLink>
      </div>
    </aside>
  )
}
