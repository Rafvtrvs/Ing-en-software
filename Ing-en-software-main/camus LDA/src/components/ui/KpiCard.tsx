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
    <Card className="flex items-start gap-4">
      <div
        className={cn(
          'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl',
          data.iconBg,
        )}
      >
        <Icon className={cn('h-6 w-6', data.iconColor)} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-500">{data.title}</p>
        <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
          {data.value}
        </p>
        <p
          className={cn(
            'mt-1 flex items-center gap-1 text-xs font-medium',
            data.trendDirection === 'up' ? 'text-emerald-600' : 'text-red-500',
          )}
        >
          <TrendIcon className="h-3.5 w-3.5" />
          {data.trend}
        </p>
      </div>
    </Card>
  )
}
