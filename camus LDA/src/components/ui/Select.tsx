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
          'w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-800',
          'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
          error ? 'border-red-300' : 'border-slate-200',
          className,
        )}
        {...props}
      >
        {children}
      </select>
    )
  },
)
