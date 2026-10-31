import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  action?: ReactNode
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-4">
      <div className="min-w-0">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 sm:text-2xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm text-slate-500 sm:text-base">{subtitle}</p>
        )}
      </div>
      {action && (
        <div className="flex w-full shrink-0 flex-col gap-2 [&_button]:w-full sm:w-auto sm:[&_button]:w-auto">
          {action}
        </div>
      )}
    </div>
  )
}
