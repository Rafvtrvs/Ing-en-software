import { forwardRef, type SelectHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select({ className, error, children, ...props }, ref) {
    return (
      <select
        ref={ref}
        className={cn(
          'box-border w-full max-w-full rounded-lg border bg-white text-slate-800',
          'dark:bg-slate-900 dark:text-slate-100',
          'min-h-11 px-3 py-2.5 text-base',
          'lg:min-h-10 lg:py-2 lg:text-sm',
          'appearance-auto truncate',
          'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
          error ? 'border-red-300 dark:border-red-500' : 'border-slate-200 dark:border-slate-600',
          className,
        )}
        {...props}
      >
        {children}
      </select>
    )
  },
)
