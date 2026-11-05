import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
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

const PANEL_MARGIN = 12
const PANEL_MAX_WIDTH = 352

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
        'flex w-full gap-3 rounded-lg px-3 py-3 text-left transition hover:bg-slate-50 dark:hover:bg-slate-700/50',
        !item.read && 'bg-primary/10',
      )}
    >
      <div
        className={cn(
          'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
          item.type === 'order' && 'bg-primary/15 text-primary',
          item.type === 'inventory' && 'bg-amber-100 text-amber-600',
          item.type === 'system' && 'bg-slate-100 text-slate-600',
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
            {item.title}
          </p>
          {!item.read && (
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
          )}
        </div>
        <p className="mt-0.5 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">
          {item.message}
        </p>
        <p className="mt-1 text-xs text-slate-400">{formatTimeAgo(item.createdAt)}</p>
      </div>
    </button>
  )
}

type PanelBox = { top: number; left: number; width: number; maxHeight: number }

function computePanelBox(anchor: DOMRect): PanelBox {
  const shell = document.querySelector('[data-mobile-shell]')?.getBoundingClientRect()
  const boundLeft = shell?.left ?? 0
  const boundRight = shell?.right ?? window.innerWidth
  const boundWidth = Math.max(0, boundRight - boundLeft)
  const available = Math.max(0, boundWidth - PANEL_MARGIN * 2)
  const width = Math.min(PANEL_MAX_WIDTH, available || PANEL_MAX_WIDTH)

  // Alinear al borde derecho del botón, pero sin salir del shell/viewport
  let left = anchor.right - width
  const minLeft = boundLeft + PANEL_MARGIN
  const maxLeft = boundRight - PANEL_MARGIN - width
  left = Math.min(Math.max(left, minLeft), Math.max(minLeft, maxLeft))

  const top = anchor.bottom + 8
  const maxHeight = Math.max(180, window.innerHeight - top - PANEL_MARGIN)

  return { top, left, width, maxHeight }
}

export function NotificationsPanel({
  variant = 'default',
}: {
  /** onPrimary: campanita sobre el header de color de marca (vista móvil) */
  variant?: 'default' | 'onPrimary'
} = {}) {
  const navigate = useNavigate()
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [box, setBox] = useState<PanelBox | null>(null)
  const items = useNotificationsStore((s) => s.items)
  const panelOpen = useNotificationsStore((s) => s.panelOpen)
  const togglePanel = useNotificationsStore((s) => s.togglePanel)
  const closePanel = useNotificationsStore((s) => s.closePanel)
  const markAsRead = useNotificationsStore((s) => s.markAsRead)
  const markAllAsRead = useNotificationsStore((s) => s.markAllAsRead)
  const unread = items.filter((n) => !n.read).length
  const onPrimary = variant === 'onPrimary'

  useLayoutEffect(() => {
    if (!panelOpen) {
      setBox(null)
      return
    }
    const update = () => {
      const anchor = buttonRef.current?.getBoundingClientRect()
      if (!anchor) return
      setBox(computePanelBox(anchor))
    }
    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [panelOpen])

  useEffect(() => {
    if (!panelOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (rootRef.current?.contains(target)) return
      const portal = document.getElementById('notifications-panel-portal')
      if (portal?.contains(target)) return
      closePanel()
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

  const panel =
    panelOpen && box
      ? createPortal(
          <div
            id="notifications-panel-portal"
            style={{
              position: 'fixed',
              top: box.top,
              left: box.left,
              width: box.width,
              maxHeight: box.maxHeight,
            }}
            className="z-[80] flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-900 shadow-xl dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-100 px-3 py-3 dark:border-slate-700 sm:px-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Notificaciones
                </p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                  {unread > 0 ? `${unread} sin leer` : 'Todo al día'}
                </p>
              </div>
              {unread > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-primary hover:bg-primary/5"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Leídas
                </button>
              )}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-2">
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
          </div>,
          document.body,
        )
      : null

  return (
    <div ref={rootRef} className="relative inline-flex shrink-0 items-center self-center">
      <button
        ref={buttonRef}
        type="button"
        onClick={togglePanel}
        className={cn(
          'relative inline-flex h-9 w-9 items-center justify-center rounded-lg',
          onPrimary
            ? cn('text-white hover:bg-white/15', panelOpen && 'bg-white/20')
            : cn(
                'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
                panelOpen && 'bg-slate-100 dark:bg-slate-800',
              ),
        )}
        aria-label="Notificaciones"
        aria-expanded={panelOpen}
      >
        <Bell className="h-5 w-5" strokeWidth={2} />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      {panel}
    </div>
  )
}
