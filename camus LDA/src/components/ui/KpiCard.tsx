import { TrendingDown, TrendingUp } from 'lucide-react'
import type { KpiData } from '@/types'
import { Card } from './Card'
import { cn } from '@/utils/cn'

interface KpiCardProps {
  data: KpiData
}

export function KpiCard({ data }: KpiCardProps) {
  const Icon = data.icon
  const TrendIcon = data.trendDirection === 'up' ? TrendingUp : TrendingDown

  return (
    <Card className="flex min-w-0 items-start gap-3 overflow-hidden sm:gap-4">
      <div
        className={cn(
          'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl sm:h-12 sm:w-12',
          data.iconBg,
        )}
      >
        <Icon className={cn('h-5 w-5 sm:h-6 sm:w-6', data.iconColor)} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-500">{data.title}</p>
        <p
          className="mt-1 text-xl font-bold leading-snug tracking-tight text-slate-900 tabular-nums break-words sm:text-2xl"
          title={String(data.value)}
        >
          {data.value}
        </p>
        <p
          className={cn(
            'mt-1.5 flex min-w-0 items-center gap-1 text-xs font-medium',
            data.trendDirection === 'up' ? 'text-emerald-600' : 'text-red-500',
          )}
        >
          <TrendIcon className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{data.trend}</span>
        </p>
      </div>
    </Card>
  )
}
