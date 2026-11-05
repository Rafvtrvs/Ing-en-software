import { useEffect, useMemo, useState } from 'react'
import { Filter, Plus, Search, Upload, X } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Pagination } from '@/components/ui/Pagination'
import { Select } from '@/components/ui/Select'
import { useInventoryStore } from '@/store/useInventoryStore'
import { exportProductsToCsv } from '@/features/inventory/utils/exportInventory'
import { ProductActionsMenu } from '@/features/inventory/components/ProductActionsMenu'
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
  const openDeleteModal = useInventoryStore((s) => s.openDeleteModal)
  const addToast = useInventoryStore((s) => s.addToast)

  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    setCurrentPage(1)
  }, [products.length, statusFilter, categoryFilter])

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
      key: 'unitCost',
      header: 'Costo unit.',
      render: (row) =>
        row.unitCost != null && row.unitCost > 0
          ? `$${Math.round(row.unitCost).toLocaleString('es-CL')}`
          : '—',
    },
    {
      key: 'status',
      header: 'Estado',
      render: (row) => <Badge label={row.status} />,
    },
    {
      key: 'actions',
      header: 'Acciones',
      className: 'w-16 whitespace-nowrap overflow-visible',
      render: (row) => (
        <ProductActionsMenu
          product={row}
          onView={openViewModal}
          onEdit={openEditModal}
          onDelete={openDeleteModal}
        />
      ),
    },
  ]

  return (
    <Card>
      <CardHeader title="Inventario de Productos" />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="w-full min-w-0 flex-1 sm:min-w-[200px]">
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
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <Button
            variant={showFilters ? 'primary' : 'outline'}
            leftIcon={<Filter className="h-4 w-4" />}
            className="w-full justify-center sm:w-auto"
            onClick={toggleFilters}
          >
            Filtros
          </Button>
          <Button
            variant="outline"
            leftIcon={<Upload className="h-4 w-4" />}
            className="w-full justify-center sm:w-auto"
            onClick={() => {
              exportProductsToCsv(filtered)
              addToast(`${filtered.length} productos exportados a CSV`)
            }}
          >
            Exportar
          </Button>
          <Button
            leftIcon={<Plus className="h-4 w-4" />}
            className="col-span-2 w-full justify-center sm:col-auto sm:w-auto"
            onClick={openCreateModal}
          >
            Nuevo Producto
          </Button>
        </div>
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
