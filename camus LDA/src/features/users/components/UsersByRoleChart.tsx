import { Card, CardHeader } from '@/components/ui/Card'
import { ChartLegend } from '@/components/ui/ChartLegend'
import { DonutChart } from '@/components/ui/DonutChart'
import { useUsersStore } from '@/store/useUsersStore'

const COLORS = ['#1B8634', '#7c3aed', '#0d9488', '#eab308', '#f97316', '#94a3b8']

export function UsersByRoleChart() {
  const users = useUsersStore((s) => s.users)
  const roles = useUsersStore((s) => s.roles)

  const data = roles
    .map((role, index) => ({
      name: role.name,
      value: users.filter((u) => u.roleId === role.id).length,
      color: COLORS[index % COLORS.length],
    }))
    .filter((item) => item.value > 0)

  const total = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <Card>
      <CardHeader title="Usuarios por Rol" />
      {total === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">Sin usuarios registrados</p>
      ) : (
        <div className="flex flex-col items-center gap-6">
          <DonutChart
            size="sm"
            data={data}
            centerValue={total.toLocaleString('es-CL')}
            centerLabel="Total"
          />
          <ChartLegend
            className="w-full"
            items={data.map((item) => ({
              name: item.name,
              value: item.value,
              color: item.color,
            }))}
            total={total}
          />
        </div>
      )}
    </Card>
  )
}
