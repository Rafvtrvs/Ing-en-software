import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCheck, ClipboardList, Package, Settings } from 'lucide-react'
import { useNotificationsStore } from '@/store/useNotificationsStore'
import type { AppNotification, NotificationType } from '@/types'
import { cn } from '@/utils/cn'

const typeIcons: Record<NotificationType, typeof Bell> = {
  order: ClipboardList,
  system: Settings,
  inventory: Package,
}

function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return `hace ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `hace ${hours} h`
  return `hace ${Math.floor(hours / 24)} d`
}

function NotificationItem({
  item,
  onSelect,
}: {
  item: AppNotification
  onSelect: (item: AppNotification) => void
}) {
  const Icon = typeIcons[item.type]

  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className={cn(
        'flex w-full gap-3 rounded-lg px-3 py-3 text-left transition hover:bg-slate-50',
        !item.read && 'bg-blue-50/60',
      )}
    >
      <div
        className={cn(
          'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
          item.type === 'order' && 'bg-blue-100 text-blue-600',
          item.type === 'inventory' && 'bg-amber-100 text-amber-600',
          item.type === 'system' && 'bg-slate-100 text-slate-600',
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-slate-900">{item.title}</p>
          {!item.read && (
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
          )}
        </div>
        <p className="mt-0.5 line-clamp-2 text-sm text-slate-600">{item.message}</p>
        <p className="mt-1 text-xs text-slate-400">{formatTimeAgo(item.createdAt)}</p>
      </div>
    </button>
  )
}

export function NotificationsPanel() {
  const navigate = useNavigate()
  const panelRef = useRef<HTMLDivElement>(null)
  const items = useNotificationsStore((s) => s.items)
  const panelOpen = useNotificationsStore((s) => s.panelOpen)
  const togglePanel = useNotificationsStore((s) => s.togglePanel)
  const closePanel = useNotificationsStore((s) => s.closePanel)
  const markAsRead = useNotificationsStore((s) => s.markAsRead)
  const markAllAsRead = useNotificationsStore((s) => s.markAllAsRead)
  const unread = items.filter((n) => !n.read).length

  useEffect(() => {
    if (!panelOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        closePanel()
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closePanel()
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [panelOpen, closePanel])

  const handleSelect = (item: AppNotification) => {
    markAsRead(item.id)
    if (item.link) {
      navigate(item.link)
      closePanel()
    }
  }

  return (
    <div ref={panelRef} className="relative">
      <button
        type="button"
        onClick={togglePanel}
        className={cn(
          'relative rounded-lg p-2 text-slate-600 hover:bg-slate-100',
          panelOpen && 'bg-slate-100',
        )}
        aria-label="Notificaciones"
        aria-expanded={panelOpen}
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {panelOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[min(100vw-2rem,22rem)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">Notificaciones</p>
              <p className="text-xs text-slate-500">
                {unread > 0 ? `${unread} sin leer` : 'Todo al día'}
              </p>
            </div>
            {unread > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-primary hover:bg-primary/5"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Marcar leídas
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto p-2">
            {items.length === 0 ? (
              <div className="px-3 py-8 text-center">
                <Bell className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-2 text-sm text-slate-500">No hay notificaciones</p>
              </div>
            ) : (
              items.map((item) => (
                <NotificationItem key={item.id} item={item} onSelect={handleSelect} />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
