import { useMemo, useState } from 'react'
import { Eye, Filter, MoreHorizontal, Pencil, Plus, Search, Upload, X } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Pagination } from '@/components/ui/Pagination'
import { Select } from '@/components/ui/Select'
import { useInventoryStore } from '@/store/useInventoryStore'
import { exportProductsToCsv } from '@/features/inventory/utils/exportInventory'
import type { InventoryStatus, Product } from '@/types'

const PAGE_SIZE = 8

export function InventoryTable() {
  const products = useInventoryStore((s) => s.products)
  const categories = useInventoryStore((s) => s.categories)
  const statusFilter = useInventoryStore((s) => s.statusFilter)
  const categoryFilter = useInventoryStore((s) => s.categoryFilter)
  const showFilters = useInventoryStore((s) => s.showFilters)
  const setStatusFilter = useInventoryStore((s) => s.setStatusFilter)
  const setCategoryFilter = useInventoryStore((s) => s.setCategoryFilter)
  const toggleFilters = useInventoryStore((s) => s.toggleFilters)
  const openCreateModal = useInventoryStore((s) => s.openCreateModal)
  const openViewModal = useInventoryStore((s) => s.openViewModal)
  const openEditModal = useInventoryStore((s) => s.openEditModal)
  const addToast = useInventoryStore((s) => s.addToast)

  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return products.filter((p) => {
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter
      const matchesCategory =
        categoryFilter === 'all' || p.category === categoryFilter
      return matchesSearch && matchesStatus && matchesCategory
    })
  }, [products, search, statusFilter, categoryFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  )

  const columns: Column<Product>[] = [
    { key: 'code', header: 'Código', className: 'font-medium text-slate-900' },
    { key: 'name', header: 'Producto' },
    { key: 'category', header: 'Categoría' },
    { key: 'currentStock', header: 'Stock Actual' },
    { key: 'minStock', header: 'Stock Mínimo' },
    { key: 'unit', header: 'Unidad' },
    {
      key: 'status',
      header: 'Estado',
      render: (row) => <Badge label={row.status} />,
    },
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
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
            aria-label="Más opciones"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <Card>
      <CardHeader title="Inventario de Productos" />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="min-w-[200px] flex-1">
          <Input
            placeholder="Buscar productos, códigos, categorías..."
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
        </Button>
        <Button
          variant="outline"
          leftIcon={<Upload className="h-4 w-4" />}
          onClick={() => {
            exportProductsToCsv(filtered)
            addToast(`${filtered.length} productos exportados a CSV`)
          }}
        >
          Exportar
        </Button>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreateModal}>
          Nuevo Producto
        </Button>
      </div>

      {showFilters && (
        <div className="mb-4 flex flex-wrap items-end gap-4 rounded-lg border border-slate-100 bg-slate-50 p-4">
          <div className="min-w-[140px]">
            <label className="mb-1.5 block text-xs font-medium text-slate-600">Estado</label>
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as InventoryStatus | 'all')
                setCurrentPage(1)
              }}
            >
              <option value="all">Todos</option>
              <option value="Ok">Ok</option>
              <option value="Bajo">Bajo</option>
              <option value="Crítico">Crítico</option>
            </Select>
          </div>
          <div className="min-w-[140px]">
            <label className="mb-1.5 block text-xs font-medium text-slate-600">Categoría</label>
            <Select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value)
                setCurrentPage(1)
              }}
            >
              <option value="all">Todas</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          {(statusFilter !== 'all' || categoryFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setStatusFilter('all')
                setCategoryFilter('all')
                setCurrentPage(1)
              }}
              className="flex items-center gap-1 text-sm text-slate-500 hover:text-primary"
            >
              <X className="h-4 w-4" />
              Limpiar filtros
            </button>
          )}
        </div>
      )}

      {paginated.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-500">No hay productos</p>
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
    </Card>
  )
}
