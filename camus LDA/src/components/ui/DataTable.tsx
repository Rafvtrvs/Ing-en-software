import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'
import { useSettingsStore } from '@/store/useSettingsStore'

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

/** RF-37 CU-127: filas alternas y alto contraste desde Configuración */
export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  className,
  tableClassName,
  onRowClick,
  selectedKey,
}: DataTableProps<T>) {
  const zebraOn = useSettingsStore((s) => s.config.appearance.zebraTables)
  const highContrast = useSettingsStore(
    (s) => s.config.appearance.highContrastTables,
  )

  return (
    <div className={cn('overflow-x-auto', className)}>
      <table
        className={cn(
          'w-full text-left text-sm',
          highContrast && 'border border-slate-300 dark:border-slate-500',
          tableClassName,
        )}
      >
        <thead>
          <tr
            className={cn(
              'border-b border-slate-100 bg-slate-50/80 dark:border-slate-700 dark:bg-slate-900/80',
              highContrast &&
                'border-b-2 border-slate-400 bg-slate-200 dark:border-slate-500 dark:bg-slate-700',
            )}
          >
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400',
                  highContrast && 'text-slate-800 dark:text-slate-100',
                  col.className,
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody
          className={cn(
            'divide-y divide-slate-50 dark:divide-slate-700',
            highContrast && 'divide-slate-200 dark:divide-slate-600',
          )}
        >
          {data.map((row, index) => {
            const rowKey = keyExtractor(row)
            const isSelected = selectedKey === rowKey
            return (
              <tr
                key={rowKey}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  'transition-colors',
                  zebraOn && index % 2 === 1 && 'bg-slate-50/90 dark:bg-slate-900/50',
                  onRowClick &&
                    'cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-700/50',
                  isSelected && 'bg-primary/5 ring-1 ring-inset ring-primary/20',
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      'px-4 py-3.5 text-slate-700 dark:text-slate-200',
                      col.className,
                    )}
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
