import { useMemo, useState } from 'react'
import { History, Search, Shield } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Pagination } from '@/components/ui/Pagination'
import { useUsersStore } from '@/store/useUsersStore'
import { formatDisplayDate } from '@/features/orders/utils/orderDates'
import type { RoleAssignmentEvent } from '@/types'

const PAGE_SIZE = 8

/**
 * RF65 — CDS 226: Registro de trazabilidad de asignación de roles
 */
export function RoleAssignmentHistoryPanel() {
  const history = useUsersStore((s) => s.roleAssignmentHistory)
  const roles = useUsersStore((s) => s.roles)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return history.filter((e) => {
      const matchesRole = roleFilter === 'all' || e.newRoleId === roleFilter
      const matchesSearch =
        !q ||
        e.userName.toLowerCase().includes(q) ||
        e.userEmail.toLowerCase().includes(q) ||
        e.newRoleName.toLowerCase().includes(q) ||
        e.previousRoleName?.toLowerCase().includes(q) ||
        e.performedByName.toLowerCase().includes(q)
      return matchesRole && matchesSearch
    })
  }, [history, search, roleFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  )

  const columns: Column<RoleAssignmentEvent>[] = [
    {
      key: 'user',
      header: 'Usuario',
      className: 'min-w-[180px]',
      render: (row) => (
        <div>
          <p className="font-medium text-slate-900">{row.userName}</p>
          <p className="text-xs text-slate-500">{row.userEmail}</p>
        </div>
      ),
    },
    {
      key: 'change',
      header: 'Cambio de rol',
      className: 'min-w-[200px]',
      render: (row) => (
        <div className="text-sm text-slate-700">
          {row.previousRoleName ? (
            <>
              <span className="text-slate-500">{row.previousRoleName}</span>
              <span className="mx-1.5 text-slate-400">→</span>
              <span className="font-medium text-slate-900">{row.newRoleName}</span>
            </>
          ) : (
            <span>
              <span className="text-slate-500">Sin rol previo → </span>
              <span className="font-medium text-slate-900">{row.newRoleName}</span>
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'performedBy',
      header: 'Asignado por',
      render: (row) => <span className="text-slate-600">{row.performedByName}</span>,
    },
    {
      key: 'date',
      header: 'Fecha y hora',
      className: 'whitespace-nowrap',
      render: (row) => (
        <span className="text-slate-600">
          {formatDisplayDate(row.performedAt.slice(0, 10))}{' '}
          {row.performedAt.includes('T') ? row.performedAt.slice(11, 16) : ''}
        </span>
      ),
    },
  ]

  return (
    <Card>
      <CardHeader
        title="Historial de Asignaciones de Rol"
        subtitle="Trazabilidad de quién asignó qué rol, cuándo y a qué usuario."
        action={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Shield className="h-3.5 w-3.5" />
            {history.length} registro{history.length !== 1 ? 's' : ''}
          </span>
        }
      />

      {history.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <History className="h-10 w-10 text-slate-300" />
          <p className="text-sm text-slate-500">
            Aún no hay asignaciones registradas. Usa &quot;Asignar rol&quot; en el listado de usuarios.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-[200px] flex-1 max-w-md">
              <Input
                placeholder="Buscar usuario, rol o autor..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setCurrentPage(1)
                }}
                icon={<Search className="h-4 w-4" />}
              />
            </div>
            <div className="min-w-[180px]">
              <label className="mb-1.5 block text-xs font-medium text-slate-600">
                Filtrar por rol asignado
              </label>
              <Select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value)
                  setCurrentPage(1)
                }}
              >
                <option value="all">Todos los roles</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="rounded-lg border border-slate-100">
            <DataTable
              columns={columns}
              data={paginated}
              keyExtractor={(r) => r.id}
              tableClassName="min-w-[720px]"
            />
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filtered.length}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
          />
        </>
      )}
    </Card>
  )
}
