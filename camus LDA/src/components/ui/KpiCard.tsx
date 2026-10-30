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
    <Card className="relative flex min-w-0 items-start gap-3 overflow-hidden sm:gap-4">
      <span className="absolute inset-x-0 top-0 h-1 bg-primary" aria-hidden />
      <div
        className={cn(
          'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl sm:h-12 sm:w-12',
          data.iconBg,
        )}
      >
        <Icon className={cn('h-5 w-5 sm:h-6 sm:w-6', data.iconColor)} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-snug text-slate-500">{data.title}</p>
        <p
          className="mt-1 whitespace-nowrap text-lg font-bold leading-tight tracking-tight text-slate-900 tabular-nums sm:text-xl"
          title={String(data.value)}
        >
          {data.value}
        </p>
        <p
          className={cn(
            'mt-1.5 flex items-start gap-1 text-xs font-medium leading-snug',
            data.trendDirection === 'up' ? 'text-emerald-600' : 'text-red-500',
          )}
        >
          <TrendIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{data.trend}</span>
        </p>
      </div>
    </Card>
  )
}
