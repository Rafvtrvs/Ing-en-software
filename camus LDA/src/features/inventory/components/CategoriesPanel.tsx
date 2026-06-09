import { useMemo, useState } from 'react'
import { Eye, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useInventoryStore } from '@/store/useInventoryStore'
import type { ProductCategory } from '@/types'

export function CategoriesPanel() {
  const categories = useInventoryStore((s) => s.categories)
  const products = useInventoryStore((s) => s.products)
  const openCategoryModal = useInventoryStore((s) => s.openCategoryModal)
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return categories.filter(
      (c) =>
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q),
    )
  }, [categories, search])

  const columns: Column<ProductCategory & { productCount: number }>[] = [
    { key: 'name', header: 'Categoría', className: 'font-medium text-slate-900' },
    { key: 'description', header: 'Descripción' },
    {
      key: 'productCount',
      header: 'Productos',
      render: (row) => (
        <span className="font-semibold text-slate-700">{row.productCount}</span>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      render: (row) => <Badge label={row.status} context="client" />,
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (row) => (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => openCategoryModal('view', row)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-primary"
            aria-label="Ver"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => openCategoryModal('edit', row)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-amber-600"
            aria-label="Editar"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => openCategoryModal('delete', row)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-red-500"
            aria-label="Eliminar"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  const rows = filtered.map((c) => ({
    ...c,
    productCount: products.filter((p) => p.category === c.name).length,
  }))

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader
            title="Categorías de Productos"
            action={
              <Button
                size="sm"
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={() => openCategoryModal('create')}
              >
                Nueva Categoría
              </Button>
            }
          />
          <div className="mb-4">
            <Input
              placeholder="Buscar categoría..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search className="h-4 w-4" />}
            />
          </div>
          <DataTable columns={columns} data={rows} keyExtractor={(r) => r.id} />
        </Card>
      </div>

      <Card>
        <CardHeader title="Resumen" />
        <ul className="space-y-3 text-sm">
          <li className="flex justify-between">
            <span className="text-slate-500">Total categorías</span>
            <span className="font-semibold">{categories.length}</span>
          </li>
          <li className="flex justify-between">
            <span className="text-slate-500">Activas</span>
            <span className="font-semibold text-emerald-600">
              {categories.filter((c) => c.status === 'Activa').length}
            </span>
          </li>
          <li className="flex justify-between">
            <span className="text-slate-500">Inactivas</span>
            <span className="font-semibold text-slate-600">
              {categories.filter((c) => c.status === 'Inactiva').length}
            </span>
          </li>
        </ul>
        <p className="mt-4 text-xs text-slate-500">
          Las categorías activas aparecen al crear o editar productos en el inventario.
        </p>
      </Card>
    </div>
  )
}
