import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { chartTooltip } from './chartTheme'

export interface DonutSlice {
  name: string
  value: number
  color?: string
}

interface DonutChartProps {
  data: DonutSlice[]
  centerValue: string
  centerLabel: string
  size?: 'sm' | 'md'
}

const SIZES = {
  sm: { box: 'h-44 w-44', inner: 52, outer: 74 },
  md: { box: 'h-52 w-52', inner: 64, outer: 88 },
} as const

export function DonutChart({
  data,
  centerValue,
  centerLabel,
  size = 'md',
}: DonutChartProps) {
  const spec = SIZES[size]

  return (
    <div className={`relative shrink-0 ${spec.box}`}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={spec.inner}
            outerRadius={spec.outer}
            paddingAngle={4}
            cornerRadius={8}
            stroke="transparent"
          >
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.color ?? '#94a3b8'} />
            ))}
          </Pie>
          <Tooltip {...chartTooltip} />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6">
        <span className="max-w-full truncate text-2xl font-bold tabular-nums tracking-tight text-slate-900 dark:text-slate-100">
          {centerValue}
        </span>
        <span className="text-xs text-slate-500">{centerLabel}</span>
      </div>
    </div>
  )
}
