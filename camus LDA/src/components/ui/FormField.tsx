import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

interface FormFieldProps {
  label: string
  htmlFor?: string
  error?: string
  required?: boolean
  children: ReactNode
  className?: string
}

/** Campo apilado (label arriba, control abajo) — estilo Terreno en móvil vía CSS global. */
export function FormField({
  label,
  htmlFor,
  error,
  required,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn('flex w-full flex-col gap-2', className)}>
      <label
        htmlFor={htmlFor}
        className="block text-sm font-semibold text-slate-900 lg:font-medium lg:text-slate-700"
      >
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      <div className="w-full min-w-0">{children}</div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
