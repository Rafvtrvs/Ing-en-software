import { cn } from '@/utils/cn'

export interface ChartLegendItem {
  name: string
  value: number
  color: string
  percent?: number
}

interface ChartLegendProps {
  items: ChartLegendItem[]
  total?: number
  className?: string
}

function formatLegendValue(value: number): string {
  if (!Number.isFinite(value)) return '—'
  if (Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toLocaleString('es-CL', {
      maximumFractionDigits: 1,
    })} M`
  }
  if (Math.abs(value) >= 10_000) {
    return `${(value / 1_000).toLocaleString('es-CL', {
      maximumFractionDigits: 1,
    })} mil`
  }
  return value.toLocaleString('es-CL')
}

export function ChartLegend({ items, total, className }: ChartLegendProps) {
  const sum = total ?? items.reduce((s, i) => s + i.value, 0)

  return (
    <ul className={cn('flex w-full min-w-0 flex-col justify-center gap-3', className)}>
      {items.map((item) => {
        const pct =
          item.percent ?? (sum ? Math.round((item.value / sum) * 100) : 0)
        return (
          <li
            key={item.name}
            className="grid w-full min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2"
          >
            <div className="flex min-w-0 items-center gap-2">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: item.color }}
                aria-hidden
              />
              <span className="truncate text-xs leading-4 text-slate-600 dark:text-slate-400 sm:text-sm sm:leading-5">
                {item.name}
              </span>
            </div>
            <span
              className="shrink-0 text-right text-xs font-medium tabular-nums leading-4 text-slate-700 dark:text-slate-200 sm:text-sm sm:leading-5"
              title={`${item.value.toLocaleString('es-CL')} (${pct}%)`}
            >
              {formatLegendValue(item.value)}
              <span className="ml-1 font-normal text-slate-500 dark:text-slate-400">
                ({pct}%)
              </span>
            </span>
          </li>
        )
      })}
    </ul>
  )
}
