import { useMemo, useState } from 'react'
import { Eye, Filter, Pencil, Search, Trash2, Upload, X } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Pagination } from '@/components/ui/Pagination'
import { Select } from '@/components/ui/Select'
import { useOrdersStore } from '@/store/useOrdersStore'
import { exportOrdersToCsv } from '@/features/orders/utils/exportOrders'
import type { OrderStatus, WorkOrder } from '@/types'

const PAGE_SIZE = 5

export function OrdersTable() {
  const orders = useOrdersStore((s) => s.orders)
  const statusFilter = useOrdersStore((s) => s.statusFilter)
  const showFilters = useOrdersStore((s) => s.showFilters)
  const setStatusFilter = useOrdersStore((s) => s.setStatusFilter)
  const toggleFilters = useOrdersStore((s) => s.toggleFilters)
  const openViewModal = useOrdersStore((s) => s.openViewModal)
  const openEditModal = useOrdersStore((s) => s.openEditModal)
  const openDeleteModal = useOrdersStore((s) => s.openDeleteModal)
  const addToast = useOrdersStore((s) => s.addToast)

  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return orders.filter((o) => {
      const matchesSearch =
        !q ||
        o.id.toLowerCase().includes(q) ||
        o.client.toLowerCase().includes(q) ||
        o.address.toLowerCase().includes(q) ||
        (o.service ?? '').toLowerCase().includes(q) ||
        o.category.toLowerCase().includes(q)
      const matchesStatus = statusFilter === 'all' || o.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [orders, search, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  )

  const handleStatusChange = (value: string) => {
    setStatusFilter(value as OrderStatus | 'all')
    setCurrentPage(1)
  }

  const columns: Column<WorkOrder>[] = [
    { key: 'id', header: 'ID Orden', className: 'font-medium text-slate-900' },
    { key: 'client', header: 'Cliente' },
    { key: 'service', header: 'Servicio', render: (row) => row.service ?? '—' },
    { key: 'category', header: 'Categoría' },
    {
      key: 'status',
      header: 'Estado',
      render: (row) => <Badge label={row.status} context="order" />,
    },
    { key: 'createdAt', header: 'Fecha Creación' },
    {
      key: 'actions',
      header: 'Acciones',
      render: (row) => (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => openViewModal(row)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-primary"
            aria-label={`Ver ${row.id}`}
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => openEditModal(row)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-amber-600"
            aria-label={`Editar ${row.id}`}
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => openDeleteModal(row)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-red-500"
            aria-label={`Eliminar ${row.id}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <Card>
      <CardHeader title="Últimas Órdenes de Trabajo" />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="min-w-[220px] flex-1">
          <Input
            placeholder="Buscar por ID, cliente, dirección, servicio..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setCurrentPage(1)
            }}
            icon={<Search className="h-4 w-4" />}
          />
        </div>
        <Button
          variant={showFilters ? 'primary' : 'outline'}
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
          leftIcon={<Upload className="h-4 w-4" />}
          onClick={() => {
            exportOrdersToCsv(filtered)
            addToast(`${filtered.length} órdenes exportadas a CSV`)
          }}
        >
          Exportar
        </Button>
      </div>

      {showFilters && (
        <div className="mb-4 flex flex-wrap items-end gap-4 rounded-lg border border-slate-100 bg-slate-50 p-4">
          <div className="min-w-[180px]">
            <label className="mb-1.5 block text-xs font-medium text-slate-600">Estado</label>
            <Select value={statusFilter} onChange={(e) => handleStatusChange(e.target.value)}>
              <option value="all">Todos</option>
              <option value="Pendiente">Pendiente</option>
              <option value="En Curso">En Curso</option>
              <option value="Abonado">Abonado</option>
              <option value="Completada">Completada</option>
              <option value="Cancelada">Cancelada</option>
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

      <DataTable columns={columns} data={paginated} keyExtractor={(r) => r.id} />
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filtered.length}
        pageSize={PAGE_SIZE}
        onPageChange={setCurrentPage}
      />
    </Card>
  )
}

