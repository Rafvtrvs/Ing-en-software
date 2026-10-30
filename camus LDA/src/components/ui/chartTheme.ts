export const chartTooltip = {
  contentStyle: {
    borderRadius: 12,
    border: '1px solid #e2e8f0',
    boxShadow: '0 10px 30px rgb(15 23 42 / 0.08)',
    fontSize: 12,
    padding: '8px 12px',
  },
  labelStyle: { color: '#0f172a', fontWeight: 600 },
  itemStyle: { color: '#334155' },
} as const

export const chartTick = { fontSize: 12, fill: '#64748b' }

export const chartGrid = {
  stroke: '#e2e8f0',
  strokeDasharray: '4 6',
  vertical: false,
} as const
