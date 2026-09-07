import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

export interface Column<T> {
  key: string
  header: string
  render?: (row: T) => ReactNode
  className?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  keyExtractor: (row: T) => string
  className?: string
  onRowClick?: (row: T) => void
  selectedKey?: string | null
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  className,
  onRowClick,
  selectedKey,
}: DataTableProps<T>) {
  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full min-w-[500px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-100">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'pb-3 pr-4 text-xs font-semibold uppercase tracking-wide text-slate-500',
                  col.className,
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {data.map((row) => {
            const rowKey = keyExtractor(row)
            const isSelected = selectedKey === rowKey
            return (
              <tr
                key={rowKey}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  'transition-colors',
                  onRowClick && 'cursor-pointer hover:bg-slate-50/80',
                  isSelected && 'bg-primary/5 ring-1 ring-inset ring-primary/20',
                )}
              >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn('py-3.5 pr-4 text-slate-700', col.className)}
                >
                  {col.render
                    ? col.render(row)
                    : String((row as Record<string, unknown>)[col.key] ?? '')}
                </td>
              ))}
            </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
