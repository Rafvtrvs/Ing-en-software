import { useMemo, useState } from 'react'
import { Eye, Filter, Pencil, Search, Trash2, Upload, X } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Pagination } from '@/components/ui/Pagination'
import { Select } from '@/components/ui/Select'
import { useUsersStore } from '@/store/useUsersStore'
import { getRoleName } from '@/data/mock/users'
import { exportUsersToCsv } from '@/features/users/utils/exportUsers'
import { formatLastLogin } from '@/features/users/utils/userFormatters'
import type { SystemUser, SystemUserStatus } from '@/types'

const PAGE_SIZE = 6

interface UsersTableProps {
  onCreateClick?: () => void
}

export function UsersTable({ onCreateClick }: UsersTableProps) {
  const users = useUsersStore((s) => s.users)
  const roles = useUsersStore((s) => s.roles)
  const statusFilter = useUsersStore((s) => s.statusFilter)
  const roleFilter = useUsersStore((s) => s.roleFilter)
  const showFilters = useUsersStore((s) => s.showFilters)
  const setStatusFilter = useUsersStore((s) => s.setStatusFilter)
  const setRoleFilter = useUsersStore((s) => s.setRoleFilter)
  const toggleFilters = useUsersStore((s) => s.toggleFilters)
  const openUserViewModal = useUsersStore((s) => s.openUserViewModal)
  const openUserEditModal = useUsersStore((s) => s.openUserEditModal)
  const openUserDeleteModal = useUsersStore((s) => s.openUserDeleteModal)
  const addToast = useUsersStore((s) => s.addToast)

  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return users.filter((u) => {
      const roleName = getRoleName(roles, u.roleId).toLowerCase()
      const matchesSearch =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.phone.includes(q) ||
        roleName.includes(q)
      const matchesStatus = statusFilter === 'all' || u.status === statusFilter
      const matchesRole = roleFilter === 'all' || u.roleId === roleFilter
      return matchesSearch && matchesStatus && matchesRole
    })
  }, [users, roles, search, statusFilter, roleFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  )

  const columns: Column<SystemUser>[] = [
    {
      key: 'name',
      header: 'Usuario',
      render: (row) => (
        <div className="flex items-center gap-3">
          <img
            src={row.avatar}
            alt=""
            className="h-9 w-9 rounded-full bg-slate-100 object-cover"
          />
          <div>
            <p className="font-medium text-slate-900">{row.name}</p>
            <p className="text-xs text-slate-500">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Rol',
      render: (row) => (
        <span className="font-medium text-slate-700">{getRoleName(roles, row.roleId)}</span>
      ),
    },
    { key: 'phone', header: 'Teléfono' },
    {
      key: 'status',
      header: 'Estado',
      render: (row) => <Badge label={row.status} context="user" />,
    },
    {
      key: 'lastLogin',
      header: 'Último acceso',
      render: (row) => (
        <span className="text-slate-600">{formatLastLogin(row.lastLogin)}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (row) => (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => openUserViewModal(row)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-primary"
            aria-label={`Ver ${row.name}`}
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => openUserEditModal(row)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-primary"
            aria-label={`Editar ${row.name}`}
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => openUserDeleteModal(row)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
            aria-label={`Eliminar ${row.name}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <Card>
      <CardHeader
        title="Listado de Usuarios"
        action={
          onCreateClick ? (
            <Button size="sm" onClick={onCreateClick}>
              Nuevo Usuario
            </Button>
          ) : undefined
        }
      />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-[200px] flex-1 max-w-md">
          <Input
            placeholder="Buscar por nombre, email o rol..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setCurrentPage(1)
            }}
            icon={<Search className="h-4 w-4" />}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={showFilters ? 'primary' : 'outline'}
            size="md"
            leftIcon={<Filter className="h-4 w-4" />}
            onClick={toggleFilters}
          >
            Filtros
          </Button>
          <Button
            variant="outline"
            size="md"
            leftIcon={<Upload className="h-4 w-4" />}
            onClick={() => {
              exportUsersToCsv(filtered, roles)
              addToast(`${filtered.length} usuarios exportados a CSV`)
            }}
          >
            Exportar
          </Button>
        </div>
      </div>

      {showFilters && (
        <div className="mb-4 flex flex-wrap items-end gap-4 rounded-lg border border-slate-100 bg-slate-50 p-4">
          <div className="min-w-[160px]">
            <label className="mb-1.5 block text-xs font-medium text-slate-600">Estado</label>
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as SystemUserStatus | 'all')
                setCurrentPage(1)
              }}
            >
              <option value="all">Todos</option>
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
              <option value="Bloqueado">Bloqueado</option>
            </Select>
          </div>
          <div className="min-w-[180px]">
            <label className="mb-1.5 block text-xs font-medium text-slate-600">Rol</label>
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
          {(statusFilter !== 'all' || roleFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setStatusFilter('all')
                setRoleFilter('all')
                setCurrentPage(1)
              }}
              className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
            >
              <X className="h-4 w-4" />
              Limpiar filtros
            </button>
          )}
        </div>
      )}

      {paginated.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-500">
          No se encontraron usuarios con los criterios seleccionados.
        </p>
      ) : (
        <>
          <DataTable columns={columns} data={paginated} keyExtractor={(row) => row.id} />
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
