import { cn } from '@/utils/cn'
import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  padding?: boolean
  id?: string
}

export function Card({ children, className, padding = true, id }: CardProps) {
  return (
    <div
      id={id}
      className={cn(
        'rounded-xl border border-slate-100 bg-white shadow-sm',
        'dark:border-slate-700 dark:bg-slate-800 dark:shadow-black/30',
        padding && 'p-4 sm:p-6',
        className,
      )}
    >
      {children}
    </div>
  )
}

interface CardHeaderProps {
  title: string
  subtitle?: string
  action?: ReactNode
}

export function CardHeader({ title, subtitle, action }: CardHeaderProps) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          {title}
        </h3>
        {subtitle && (
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  )
}
