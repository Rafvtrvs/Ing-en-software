import { Card, CardHeader } from '@/components/ui/Card'
import { ChartLegend } from '@/components/ui/ChartLegend'
import { DonutChart } from '@/components/ui/DonutChart'
import type { ChartDataPoint } from '@/types'

interface ReportDonutChartProps {
  title: string
  data: ChartDataPoint[]
}

export function ReportDonutChart({ title, data }: ReportDonutChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <Card>
      <CardHeader title={title} />
      {total === 0 ? (
        <p className="py-10 text-center text-sm text-slate-500">Sin datos para mostrar</p>
      ) : (
        <div className="flex flex-col items-center gap-6 xl:flex-row xl:items-center xl:justify-between">
          <DonutChart
            size="sm"
            data={data}
            centerValue={total.toLocaleString('es-CL')}
            centerLabel="Total"
          />
          <ChartLegend
            className="w-full xl:min-w-[200px] xl:flex-1 xl:max-w-[280px]"
            items={data.map((item) => ({
              name: item.name,
              value: item.value,
              color: item.color ?? '#94a3b8',
            }))}
            total={total}
          />
        </div>
      )}
    </Card>
  )
}
