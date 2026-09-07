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

export function ChartLegend({ items, total, className }: ChartLegendProps) {
  const sum = total ?? items.reduce((s, i) => s + i.value, 0)

  return (
    <ul className={cn('flex w-full flex-col justify-center gap-4', className)}>
      {items.map((item) => {
        const pct =
          item.percent ?? (sum ? Math.round((item.value / sum) * 100) : 0)
        return (
          <li
            key={item.name}
            className="flex w-full items-center justify-between gap-6"
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: item.color }}
                aria-hidden
              />
              <span className="text-sm leading-5 text-slate-600">{item.name}</span>
            </div>
            <span className="shrink-0 text-right text-sm font-semibold leading-5 tabular-nums text-slate-900">
              {item.value} ({pct}%)
            </span>
          </li>
        )
      })}
    </ul>
  )
}
