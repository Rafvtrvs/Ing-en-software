import { useMemo, useState } from 'react'
import { Eye, Filter, Pencil, Search, Trash2, Upload, X } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Pagination } from '@/components/ui/Pagination'
import { Select } from '@/components/ui/Select'
import { useClientsStore } from '@/store/useClientsStore'
import { exportClientsToCsv } from '@/features/clients/utils/exportClients'
import type { Client, ClientStatus } from '@/types'
import { cn } from '@/utils/cn'

const PAGE_SIZE = 5

interface ClientsTableProps {
  onCreateClick?: () => void
}

export function ClientsTable({ onCreateClick }: ClientsTableProps) {
  const clients = useClientsStore((s) => s.clients)
  const statusFilter = useClientsStore((s) => s.statusFilter)
  const showFilters = useClientsStore((s) => s.showFilters)
  const setStatusFilter = useClientsStore((s) => s.setStatusFilter)
  const toggleFilters = useClientsStore((s) => s.toggleFilters)
  const openViewModal = useClientsStore((s) => s.openViewModal)
  const openEditModal = useClientsStore((s) => s.openEditModal)
  const openDeleteModal = useClientsStore((s) => s.openDeleteModal)
  const addToast = useClientsStore((s) => s.addToast)

  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return clients.filter((c) => {
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q) ||
        c.rut.includes(q) ||
        c.email.toLowerCase().includes(q)
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [clients, search, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  )

  const handleSearch = (value: string) => {
    setSearch(value)
    setCurrentPage(1)
  }

  const handleExport = () => {
    exportClientsToCsv(filtered)
    addToast(`${filtered.length} clientes exportados a CSV`)
  }

  const handleStatusChange = (value: string) => {
    setStatusFilter(value as ClientStatus | 'all')
    setCurrentPage(1)
  }

  const columns: Column<Client>[] = [
    {
      key: 'name',
      header: 'Cliente',
      render: (row) => <p className="font-medium text-slate-900">{row.name}</p>,
    },
    { key: 'company', header: 'Empresa' },
    { key: 'rut', header: 'RUT' },
    { key: 'phone', header: 'Teléfono' },
    { key: 'email', header: 'Email' },
    {
      key: 'status',
      header: 'Estado',
      render: (row) => <Badge label={row.status} context="client" />,
    },
    { key: 'lastOrder', header: 'Última Orden' },
    {
      key: 'actions',
      header: 'Acciones',
      render: (row) => (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => openViewModal(row)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-primary"
            aria-label={`Ver ${row.name}`}
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => openEditModal(row)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-amber-600"
            aria-label={`Editar ${row.name}`}
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => openDeleteModal(row)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-red-500"
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
        title="Lista de Clientes"
        action={
          onCreateClick && (
            <Button size="sm" onClick={onCreateClick} className="hidden sm:inline-flex">
              + Nuevo
            </Button>
          )
        }
      />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="min-w-[200px] flex-1">
          <Input
            placeholder="Buscar cliente..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            icon={<Search className="h-4 w-4" />}
          />
        </div>
        <Button
          variant={showFilters ? 'primary' : 'outline'}
          size="md"
          leftIcon={<Filter className="h-4 w-4" />}
          onClick={toggleFilters}
        >
          Filtros
          {statusFilter !== 'all' && (
            <span className="ml-1 rounded-full bg-white/20 px-1.5 text-xs">1</span>
          )}
        </Button>
        <Button
          variant="outline"
          size="md"
          leftIcon={<Upload className="h-4 w-4" />}
          onClick={handleExport}
        >
          Exportar
        </Button>
      </div>

      {showFilters && (
        <div className="mb-4 flex flex-wrap items-end gap-4 rounded-lg border border-slate-100 bg-slate-50 p-4">
          <div className="min-w-[180px]">
            <label className="mb-1.5 block text-xs font-medium text-slate-600">
              Estado
            </label>
            <Select value={statusFilter} onChange={(e) => handleStatusChange(e.target.value)}>
              <option value="all">Todos</option>
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Bloqueado">Bloqueado</option>
            </Select>
          </div>
          {statusFilter !== 'all' && (
            <button
              type="button"
              onClick={() => handleStatusChange('all')}
              className="flex items-center gap-1 text-sm text-slate-500 hover:text-primary"
            >
              <X className="h-4 w-4" />
              Limpiar filtros
            </button>
          )}
        </div>
      )}

      {paginated.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-slate-500">No se encontraron clientes</p>
          {(search || statusFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                handleSearch('')
                handleStatusChange('all')
              }}
              className="mt-2 text-sm font-medium text-primary hover:underline"
            >
              Limpiar búsqueda y filtros
            </button>
          )}
        </div>
      ) : (
        <>
          <DataTable columns={columns} data={paginated} keyExtractor={(r) => r.id} />
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filtered.length}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
          />
        </>
      )}

      {statusFilter !== 'all' && (
        <p className={cn('mt-2 text-xs text-slate-400')}>
          Filtrando por estado: <strong>{statusFilter}</strong>
        </p>
      )}
    </Card>
  )
}
