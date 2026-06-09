import { CheckCircle, Info, X, XCircle } from 'lucide-react'
import { cn } from '@/utils/cn'

export interface ToastItem {
  id: number
  type: 'success' | 'error' | 'info'
  message: string
}

const icons = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
}

const styles = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  error: 'border-red-200 bg-red-50 text-red-800',
  info: 'border-blue-200 bg-blue-50 text-blue-800',
}

export function ToastContainer() {
  return null
}

interface ToastContainerProps {
  toasts: ToastItem[]
  onRemove: (id: number) => void
}

export function ToastContainerView({ toasts, onRemove }: ToastContainerProps) {

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((toast) => {
        const Icon = icons[toast.type]
        return (
          <div
            key={toast.id}
            className={cn(
              'flex min-w-[280px] items-center gap-3 rounded-lg border px-4 py-3 shadow-lg',
              styles[toast.type],
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
            <p className="flex-1 text-sm font-medium">{toast.message}</p>
            <button
              type="button"
              onClick={() => onRemove(toast.id)}
              className="rounded p-0.5 opacity-70 hover:opacity-100"
              aria-label="Cerrar notificación"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
