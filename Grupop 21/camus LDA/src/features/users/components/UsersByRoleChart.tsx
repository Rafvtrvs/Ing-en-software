import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import { Card, CardHeader } from '@/components/ui/Card'
import { ChartLegend } from '@/components/ui/ChartLegend'
import { useUsersStore } from '@/store/useUsersStore'

const COLORS = ['#2563eb', '#7c3aed', '#0d9488', '#eab308', '#f97316', '#94a3b8']

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
        <div className="flex flex-col items-center gap-8 md:flex-row md:items-center md:justify-between">
          <div className="relative h-44 w-44 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={72}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-slate-900">{total}</span>
              <span className="text-xs text-slate-500">Total</span>
            </div>
          </div>
          <ChartLegend
            className="md:min-w-[200px] md:flex-1 md:max-w-[240px]"
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
