import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/utils/cn'
import { useIsMobileViewport } from '@/hooks/useIsMobileViewport'
import { clearStackedFormStyles, stackFormGrids } from '@/utils/stackFormGrids'

interface DrawerProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  footer?: ReactNode
  widthClassName?: string
}

export function Drawer({
  open,
  onClose,
  title,
  children,
  footer,
  widthClassName = 'max-w-[420px]',
}: DrawerProps) {
  const isMobile = useIsMobileViewport()
  const bodyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKey)
    }
  }, [open, onClose])

  useEffect(() => {
    const root = bodyRef.current
    if (!open || !root) return
    if (!isMobile) {
      clearStackedFormStyles(root)
      return
    }
    const apply = () => stackFormGrids(root)
    apply()
    const obs = new MutationObserver(apply)
    obs.observe(root, { childList: true, subtree: true, attributes: true })
    const t1 = window.setTimeout(apply, 0)
    const t2 = window.setTimeout(apply, 100)
    return () => {
      obs.disconnect()
      window.clearTimeout(t1)
      window.clearTimeout(t2)
      clearStackedFormStyles(root)
    }
  }, [open, isMobile, children])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
        onClick={onClose}
        aria-hidden
      />

      <aside
        role="dialog"
        aria-modal="true"
        data-form-layout={isMobile ? 'stack' : 'grid'}
        className={cn(
          'absolute flex flex-col bg-white shadow-2xl dark:bg-slate-800 dark:text-slate-100',
          isMobile
            ? 'inset-x-0 bottom-0 top-8 max-h-[92dvh] w-full rounded-t-2xl border-t border-slate-200 dark:border-slate-700'
            : cn(
                'inset-y-0 right-0 h-full w-full border-l border-slate-200 dark:border-slate-700',
                widthClassName,
              ),
        )}
      >
        {isMobile && (
          <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-slate-200 dark:bg-slate-600" />
        )}

        <div
          className={cn(
            'flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-700',
            isMobile ? 'px-4 py-3' : 'px-5 py-4',
          )}
        >
          <div className="min-w-0">
            {title && (
              <h2 className="truncate text-base font-semibold text-slate-900 dark:text-slate-100">
                {title}
              </h2>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div
          ref={bodyRef}
          className={cn(
            'form-stack-host min-h-0 flex-1 overflow-y-auto overscroll-contain',
            isMobile ? 'flex flex-col gap-3 px-4 py-3' : 'px-5 py-4',
          )}
        >
          {children}
        </div>

        {footer && (
          <div
            className={cn(
              'shrink-0 border-t border-slate-100 dark:border-slate-700',
              isMobile
                ? 'flex flex-col gap-2 px-4 py-3 [&_button]:w-full'
                : 'flex flex-wrap justify-end gap-3 px-5 py-4',
            )}
          >
            {footer}
          </div>
        )}
      </aside>
    </div>
  )
}
