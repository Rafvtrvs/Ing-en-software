import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/utils/cn'
import { stackFormGrids, clearStackedFormStyles } from '@/utils/stackFormGrids'
import { FORM_STACK_MAX_WIDTH } from '@/hooks/useIsMobileViewport'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

/**
 * Modal con layout móvil por CSS (max-lg), igual que Terreno.
 * No depende solo de React/matchMedia.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: ModalProps) {
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

  // Refuerzo: forzar columna si el viewport es estrecho
  useEffect(() => {
    const root = bodyRef.current
    if (!open || !root) return

    const apply = () => {
      if (window.innerWidth <= FORM_STACK_MAX_WIDTH) {
        stackFormGrids(root)
      } else {
        clearStackedFormStyles(root)
      }
    }
    apply()
    const obs = new MutationObserver(apply)
    obs.observe(root, { childList: true, subtree: true })
    window.addEventListener('resize', apply)
    const t1 = window.setTimeout(apply, 0)
    const t2 = window.setTimeout(apply, 150)
    return () => {
      obs.disconnect()
      window.removeEventListener('resize', apply)
      window.clearTimeout(t1)
      window.clearTimeout(t2)
      clearStackedFormStyles(root)
    }
  }, [open, children])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center lg:items-center lg:p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        data-form-layout="stack"
        className={cn(
          'relative z-10 flex w-full max-w-none flex-col bg-white shadow-xl dark:bg-slate-800 dark:text-slate-100',
          'max-h-[92dvh] rounded-t-2xl',
          'lg:max-h-[90vh] lg:rounded-xl',
          size === 'sm' && 'lg:max-w-md',
          size === 'md' && 'lg:max-w-lg',
          size === 'lg' && 'lg:max-w-2xl',
        )}
      >
        {/* Handle móvil */}
        <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-slate-300 lg:hidden" />

        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-700 lg:px-6 lg:py-4">
          <div className="min-w-0 flex-1">
            <h2
              id="modal-title"
              className="text-base font-semibold text-slate-900 dark:text-slate-100 lg:text-lg"
            >
              {title}
            </h2>
            {description && (
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 lg:text-sm">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div
          ref={bodyRef}
          className={cn(
            'form-stack-host min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 lg:px-6',
            // Estilo Terreno en < lg
            '[&_form]:flex [&_form]:flex-col [&_form]:gap-4',
            '[&_.grid]:flex [&_.grid]:flex-col [&_.grid]:gap-4',
            'lg:[&_.grid]:grid',
          )}
        >
          <div className="space-y-4 rounded-xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/40 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
            {children}
          </div>
        </div>

        {footer && (
          <div
            className={cn(
              'modal-footer shrink-0 border-t border-slate-100 px-4 py-3 dark:border-slate-700 lg:px-6 lg:py-4',
              // Móvil: columna, botones full-width y misma altura
              'flex w-full flex-col-reverse gap-2',
              '[&_button]:flex [&_button]:h-11 [&_button]:w-full [&_button]:min-w-0 [&_button]:max-w-none [&_button]:shrink-0 [&_button]:justify-center [&_button]:text-base',
              // Desktop: fila compacta a la derecha
              'lg:flex-row lg:justify-end lg:gap-3',
              'lg:[&_button]:h-auto lg:[&_button]:w-auto lg:[&_button]:text-sm',
            )}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
