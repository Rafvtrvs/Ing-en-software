import { useMemo, useState } from 'react'
import { History, Search } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Pagination } from '@/components/ui/Pagination'
import { useUsersStore } from '@/store/useUsersStore'
import { formatDisplayDate } from '@/features/orders/utils/orderDates'
import type { UserLifecycleAction, UserLifecycleEvent } from '@/types'

const PAGE_SIZE = 8

const actionStyles: Record<UserLifecycleAction, string> = {
  eliminado: 'bg-red-50 text-red-700 ring-red-600/20',
  desactivado: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  reactivado: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
}

const actionLabels: Record<UserLifecycleAction, string> = {
  eliminado: 'Eliminado',
  desactivado: 'Desactivado',
  reactivado: 'Reactivado',
}

/**
 * RF64 — CDS 223: Revisando historial de desactivación y eliminación de usuarios
 */
export function UserLifecycleHistoryPanel() {
  const history = useUsersStore((s) => s.lifecycleHistory)
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState<UserLifecycleAction | 'all'>('all')
  const [currentPage, setCurrentPage] = useState(1)

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return history.filter((e) => {
      const matchesAction = actionFilter === 'all' || e.action === actionFilter
      const matchesSearch =
        !q ||
        e.userName.toLowerCase().includes(q) ||
        e.userEmail.toLowerCase().includes(q) ||
        e.performedByName.toLowerCase().includes(q)
      return matchesAction && matchesSearch
    })
  }, [history, search, actionFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  )

  const columns: Column<UserLifecycleEvent>[] = [
    {
      key: 'user',
      header: 'Usuario',
      render: (row) => (
        <div>
          <p className="font-medium text-slate-900">{row.userName}</p>
          <p className="text-xs text-slate-500">{row.userEmail}</p>
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Acción',
      render: (row) => (
        <Badge label={actionLabels[row.action]} className={actionStyles[row.action]} />
      ),
    },
    {
      key: 'performedBy',
      header: 'Autor',
      render: (row) => <span className="text-slate-600">{row.performedByName}</span>,
    },
    {
      key: 'date',
      header: 'Fecha y hora',
      render: (row) => (
        <span className="text-slate-600">
          {formatDisplayDate(row.performedAt.slice(0, 10))}{' '}
          {row.performedAt.includes('T')
            ? row.performedAt.slice(11, 16)
            : ''}
        </span>
      ),
    },
    {
      key: 'reason',
      header: 'Motivo',
      render: (row) => (
        <span className="text-xs text-slate-500">{row.reason ?? '—'}</span>
      ),
    },
  ]

  return (
    <Card>
      <CardHeader
        title="Historial de Usuarios"
        subtitle="Registro de eliminaciones, desactivaciones y reactivaciones."
        action={
          <div className="flex items-center gap-1.5 text-sm text-slate-500">
            <History className="h-4 w-4" />
            {filtered.length} eventos
          </div>
        }
      />

      <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
        Cada vez que desactivas, reactivas o eliminas un usuario en la pestaña Usuarios,
        el sistema guarda aquí la fecha, el autor y la acción realizada.
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <Input
            placeholder="Buscar por usuario o autor..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setCurrentPage(1)
            }}
            icon={<Search className="h-4 w-4" />}
          />
        </div>
        <Select
          value={actionFilter}
          onChange={(e) => {
            setActionFilter(e.target.value as UserLifecycleAction | 'all')
            setCurrentPage(1)
          }}
          className="w-full sm:w-48"
          aria-label="Filtrar por acción"
        >
          <option value="all">Todas las acciones</option>
          <option value="desactivado">Desactivados</option>
          <option value="eliminado">Eliminados</option>
          <option value="reactivado">Reactivados</option>
        </Select>
      </div>

      {paginated.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-sm text-slate-500">No hay registros para mostrar.</p>
          <p className="mt-2 text-xs text-slate-400">
            Desactiva o elimina un usuario para generar el primer evento en el historial.
          </p>
        </div>
      ) : (
        <>
          <DataTable
            columns={columns}
            data={paginated}
            keyExtractor={(row) => row.id}
          />
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
