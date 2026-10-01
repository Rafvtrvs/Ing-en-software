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
  tableClassName?: string
  onRowClick?: (row: T) => void
  selectedKey?: string | null
}

/** RF-37 CU-127: respeta zebra / alto contraste desde preferencias (html[data-*]) */
export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  className,
  tableClassName,
  onRowClick,
  selectedKey,
}: DataTableProps<T>) {
  const zebraOn =
    typeof document !== 'undefined' &&
    document.documentElement.dataset.zebraTables === 'true'
  const highContrast =
    typeof document !== 'undefined' &&
    document.documentElement.dataset.highContrastTables === 'true'

  return (
    <div className={cn('overflow-x-auto', className)}>
      <table
        className={cn(
          'w-full text-left text-sm',
          highContrast && 'border border-slate-300',
          tableClassName,
        )}
      >
        <thead>
          <tr
            className={cn(
              'border-b border-slate-100 bg-slate-50/80',
              highContrast && 'border-slate-400 bg-slate-200',
            )}
          >
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500',
                  col.className,
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {data.map((row, index) => {
            const rowKey = keyExtractor(row)
            const isSelected = selectedKey === rowKey
            return (
              <tr
                key={rowKey}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  'transition-colors',
                  zebraOn && index % 2 === 1 && 'bg-slate-50/90',
                  onRowClick && 'cursor-pointer hover:bg-slate-50/80',
                  isSelected && 'bg-primary/5 ring-1 ring-inset ring-primary/20',
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn('px-4 py-3.5 text-slate-700', col.className)}
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
