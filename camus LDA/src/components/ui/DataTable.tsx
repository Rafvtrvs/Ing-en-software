import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'
import { useSettingsStore } from '@/store/useSettingsStore'
import { useIsMobileViewport } from '@/hooks/useIsMobileViewport'

export interface Column<T> {
  key: string
  header: string
  render?: (row: T) => ReactNode
  className?: string
  /** Título del card en móvil (por defecto: primera columna que no sea actions) */
  mobileTitle?: boolean
  /** No mostrar en la vista card de móvil */
  mobileHidden?: boolean
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

function cellContent<T>(col: Column<T>, row: T): ReactNode {
  if (col.render) return col.render(row)
  const raw = (row as Record<string, unknown>)[col.key]
  return raw == null ? '' : String(raw)
}

function cellText<T>(col: Column<T>, row: T): string {
  const raw = (row as Record<string, unknown>)[col.key]
  return raw == null ? '' : String(raw)
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
  const isMobile = useIsMobileViewport()
  const zebraOn = useSettingsStore((s) => s.config.appearance.zebraTables)
  const highContrast = useSettingsStore(
    (s) => s.config.appearance.highContrastTables,
  )

  const titleCol =
    columns.find((c) => c.mobileTitle) ??
    columns.find((c) => c.key !== 'actions' && !c.mobileHidden)
  const actionCol = columns.find((c) => c.key === 'actions')
  const detailCols = columns.filter(
    (c) =>
      c.key !== 'actions' &&
      !c.mobileHidden &&
      c !== titleCol &&
      !c.mobileTitle,
  )

  if (isMobile) {
    return (
      <div className={cn('space-y-3', className)} role="list">
        {data.map((row, index) => {
          const rowKey = keyExtractor(row)
          const isSelected = selectedKey === rowKey
          return (
            <div
              key={rowKey}
              role="listitem"
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn(
                'rounded-xl border border-slate-100 bg-white p-3.5 shadow-sm',
                'dark:border-slate-700 dark:bg-slate-800',
                zebraOn && index % 2 === 1 && 'bg-slate-50 dark:bg-slate-900/60',
                highContrast && 'border-slate-300 dark:border-slate-500',
                onRowClick && 'cursor-pointer active:bg-slate-50 dark:active:bg-slate-700/50',
                isSelected && 'ring-2 ring-primary/30',
              )}
            >
              {titleCol && (
                <div className="min-w-0 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {cellContent(titleCol, row)}
                </div>
              )}

              {detailCols.length > 0 && (
                <dl className="mt-2.5 space-y-2">
                  {detailCols.map((col) => (
                    <div
                      key={col.key}
                      className="flex items-start justify-between gap-3 text-sm"
                    >
                      <dt className="shrink-0 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        {col.header}
                      </dt>
                      <dd
                        className={cn(
                          'min-w-0 max-w-[65%] text-right text-slate-700 dark:text-slate-200',
                          !col.render && 'truncate',
                        )}
                        title={!col.render ? cellText(col, row) : undefined}
                      >
                        {cellContent(col, row)}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}

              {actionCol?.render && (
                <div
                  className="mt-3 flex flex-wrap items-center justify-end gap-1 border-t border-slate-100 pt-2.5 dark:border-slate-700"
                  onClick={(e) => e.stopPropagation()}
                >
                  {actionCol.render(row)}
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className={cn('-mx-1 overflow-x-auto sm:mx-0', className)}>
      <table
        className={cn(
          'w-full min-w-[40rem] text-left text-sm',
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
                  'px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400',
                  !col.render && 'truncate',
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
                {columns.map((col) => {
                  const text = cellText(col, row)
                  return (
                    <td
                      key={col.key}
                      title={!col.render && text ? text : undefined}
                      className={cn(
                        'overflow-hidden px-3 py-3.5 text-slate-700 dark:text-slate-200',
                        !col.render && 'truncate',
                        col.className,
                      )}
                    >
                      {cellContent(col, row)}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
