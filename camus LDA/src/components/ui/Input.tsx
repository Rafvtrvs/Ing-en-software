import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/utils/cn'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input({ className, icon, ...props }, ref) {
    return (
      <div className="relative w-full min-w-0">
        {icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          className={cn(
            'box-border w-full max-w-full rounded-lg border border-slate-200 bg-white text-slate-800',
            'dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100',
            'min-h-11 px-3 py-2.5 text-base',
            'lg:min-h-10 lg:py-2 lg:text-sm',
            'placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
            icon ? 'pl-10 pr-3' : 'px-3 lg:px-4',
            className,
          )}
          {...props}
        />
      </div>
    )
  },
)
