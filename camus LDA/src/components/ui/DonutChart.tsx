import { useState } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import type { TooltipProps } from 'recharts'
import { chartTooltip } from './chartTheme'

export interface DonutSlice {
  name: string
  value: number
  color?: string
  /** Nombres de ítems al hacer hover (p. ej. productos por estado) */
  items?: string[]
}

interface DonutChartProps {
  data: DonutSlice[]
  centerValue: string
  centerLabel: string
  size?: 'sm' | 'md'
  showTooltip?: boolean
  onSliceActive?: (slice: DonutSlice | null) => void
}

const SIZES = {
  sm: { box: 'h-44 w-44', inner: 52, outer: 74 },
  md: { box: 'h-52 w-52', inner: 64, outer: 88 },
} as const

const MAX_ITEMS_IN_TOOLTIP = 10

function SimpleDonutTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null
  const row = payload[0]?.payload as DonutSlice | undefined
  if (!row) return null
  if (row.items && row.items.length > 0) return null

  return (
    <div style={chartTooltip.contentStyle} className="bg-white">
      <p style={chartTooltip.labelStyle}>{row.name}</p>
      <p style={chartTooltip.itemStyle} className="mt-0.5">
        {row.value.toLocaleString('es-CL')}
      </p>
    </div>
  )
}

export function DonutChart({
  data,
  centerValue,
  centerLabel,
  size = 'md',
  showTooltip = true,
  onSliceActive,
}: DonutChartProps) {
  const spec = SIZES[size]
  const [activeSlice, setActiveSlice] = useState<DonutSlice | null>(null)

  const hasItemDetails = data.some((d) => (d.items?.length ?? 0) > 0)
  const detailItems = activeSlice?.items ?? []
  const visibleItems = detailItems.slice(0, MAX_ITEMS_IN_TOOLTIP)
  const remaining = detailItems.length - visibleItems.length

  const setActive = (slice: DonutSlice | null) => {
    setActiveSlice(slice)
    onSliceActive?.(slice)
  }

  return (
    <div className="relative flex shrink-0 items-center">
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
              onMouseEnter={(_, index) => {
                const slice = data[index]
                if (slice) setActive(slice)
              }}
              onMouseLeave={() => setActive(null)}
            >
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.color ?? '#94a3b8'} />
              ))}
            </Pie>
            {showTooltip ? <Tooltip content={<SimpleDonutTooltip />} /> : null}
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6">
          <span className="max-w-full truncate text-2xl font-bold tabular-nums tracking-tight text-slate-900 dark:text-slate-100">
            {centerValue}
          </span>
          <span className="text-xs text-slate-500">{centerLabel}</span>
        </div>
      </div>

      {hasItemDetails ? (
        <div
          className={`ml-3 w-44 shrink-0 transition-opacity ${
            activeSlice ? 'opacity-100' : 'opacity-0'
          }`}
          aria-hidden={!activeSlice}
        >
          {activeSlice ? (
            <div style={chartTooltip.contentStyle} className="bg-white shadow-md">
              <div className="flex items-center gap-1.5">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: activeSlice.color }}
                  aria-hidden
                />
                <p style={chartTooltip.labelStyle}>{activeSlice.name}</p>
              </div>
              <p style={chartTooltip.itemStyle} className="mt-0.5">
                {activeSlice.value.toLocaleString('es-CL')} und.
              </p>
              {visibleItems.length > 0 ? (
                <ul className="mt-2 max-h-36 space-y-1 overflow-hidden border-t border-slate-100 pt-2 text-left text-[11px] leading-snug text-slate-600">
                  {visibleItems.map((item) => (
                    <li key={item} className="truncate">
                      {item}
                    </li>
                  ))}
                  {remaining > 0 ? (
                    <li className="font-medium text-slate-500">y {remaining} más…</li>
                  ) : null}
                </ul>
              ) : null}
            </div>
          ) : (
            <div className="h-[1px] w-full" />
          )}
        </div>
      ) : null}
    </div>
  )
}
