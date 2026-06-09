import { Select } from '@/components/ui/Select'
import { useReportsStore } from '@/store/useReportsStore'
import type { ReportPeriod } from '@/types'

const PERIOD_LABELS: Record<ReportPeriod, string> = {
  month: 'Este mes',
  quarter: 'Último trimestre',
  year: 'Este año',
}

interface ReportPeriodSelectProps {
  className?: string
}

export function ReportPeriodSelect({ className }: ReportPeriodSelectProps) {
  const period = useReportsStore((s) => s.period)
  const setPeriod = useReportsStore((s) => s.setPeriod)

  return (
    <Select
      className={className}
      value={period}
      onChange={(e) => setPeriod(e.target.value as ReportPeriod)}
    >
      {(Object.keys(PERIOD_LABELS) as ReportPeriod[]).map((key) => (
        <option key={key} value={key}>
          {PERIOD_LABELS[key]}
        </option>
      ))}
    </Select>
  )
}
