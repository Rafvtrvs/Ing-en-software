import { cn } from '@/utils/cn'

const statusStyles: Record<string, string> = {
  Pendiente: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  'En Curso': 'bg-amber-50 text-amber-700 ring-amber-600/20',
  Completada: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  Abonado: 'bg-violet-50 text-violet-700 ring-violet-600/20',
  Cancelada: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  Crítico: 'bg-red-50 text-red-700 ring-red-600/20',
  Bajo: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  Ok: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
}

const clientStatusStyles: Record<string, string> = {
  Activo: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  Activa: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  Inactivo: 'bg-red-50 text-red-700 ring-red-600/20',
  Inactiva: 'bg-red-50 text-red-700 ring-red-600/20',
  Pendiente: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  Bloqueado: 'bg-slate-100 text-slate-600 ring-slate-500/20',
}

const userStatusStyles: Record<string, string> = {
  Activo: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  Inactivo: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  Bloqueado: 'bg-red-50 text-red-700 ring-red-600/20',
}

const billingStatusStyles: Record<string, string> = {
  Borrador: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  Emitida: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  Pagada: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  Vencida: 'bg-red-50 text-red-700 ring-red-600/20',
  Anulada: 'bg-slate-100 text-slate-500 ring-slate-400/20',
}

interface BadgeProps {
  label: string
  className?: string
  context?: 'client' | 'order' | 'field' | 'billing' | 'user'
}

const fieldStatusStyles: Record<string, string> = {
  'En Curso': 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  'En Ruta': 'bg-blue-50 text-blue-700 ring-blue-600/20',
  'En Espera': 'bg-amber-50 text-amber-700 ring-amber-600/20',
  Completada: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  Retrasada: 'bg-red-50 text-red-700 ring-red-600/20',
}

export function Badge({ label, className, context }: BadgeProps) {
  const style =
    context === 'client'
      ? clientStatusStyles[label]
      : context === 'field'
        ? fieldStatusStyles[label]
        : context === 'billing'
          ? billingStatusStyles[label]
          : context === 'user'
            ? userStatusStyles[label]
            : statusStyles[label]

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        style ?? 'bg-slate-100 text-slate-600 ring-slate-500/20',
        className,
      )}
    >
      {label}
    </span>
  )
}
