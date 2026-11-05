import { useEffect, useMemo, useState } from 'react'
import { Eye, Package, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useInventoryStore } from '@/store/useInventoryStore'
import type { ProductKit } from '@/types'

export function KitsPanel() {
  const kits = useInventoryStore((s) => s.kits)
  const openKitModal = useInventoryStore((s) => s.openKitModal)
  const syncKitsFromApi = useInventoryStore((s) => s.syncKitsFromApi)
  const syncProductsFromApi = useInventoryStore((s) => s.syncProductsFromApi)
  const apiAvailable = useInventoryStore((s) => s.apiAvailable)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    void (async () => {
      setLoading(true)
      await Promise.all([syncKitsFromApi(), syncProductsFromApi()])
      setLoading(false)
    })()
  }, [syncKitsFromApi, syncProductsFromApi])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return kits.filter(
      (k) =>
        !q ||
        k.name.toLowerCase().includes(q) ||
        k.description.toLowerCase().includes(q) ||
        k.items.some((i) => i.productName.toLowerCase().includes(q)),
    )
  }, [kits, search])

  const columns: Column<ProductKit & { itemCount: number }>[] = [
    {
      key: 'name',
      header: 'Kit / Paquete',
      className: 'font-medium text-slate-900',
    },
    { key: 'description', header: 'Descripción' },
    {
      key: 'itemCount',
      header: 'Productos',
      render: (row) => <span className="font-semibold">{row.itemCount}</span>,
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
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => openKitModal('view', row)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-primary"
            aria-label={`Ver ${row.name}`}
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => openKitModal('edit', row)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-amber-600"
            aria-label={`Editar ${row.name}`}
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => openKitModal('delete', row)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-red-500"
            aria-label={`Eliminar ${row.name}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  const rows = filtered.map((k) => ({ ...k, itemCount: k.items.length }))

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader
            title="Kits y Paquetes"
            subtitle={
              apiAvailable
                ? 'Agrupa productos reales del inventario.'
                : 'Sin sincronización: reintenta si no ves kits nuevos.'
            }
            action={
              <Button
                size="sm"
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={() => openKitModal('create')}
              >
                Nuevo Kit
              </Button>
            }
          />
          <div className="mb-4">
            <Input
              placeholder="Buscar kit o producto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search className="h-4 w-4" />}
            />
          </div>
          {loading ? (
            <p className="py-8 text-center text-sm text-slate-500">Cargando kits...</p>
          ) : rows.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              No hay kits aún. Crea uno para agrupar productos del inventario.
            </p>
          ) : (
            <DataTable columns={columns} data={rows} keyExtractor={(r) => r.id} />
          )}
        </Card>
      </div>
      <Card>
        <CardHeader title="Resumen de Kits" />
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
          <Package className="h-6 w-6 text-primary" />
        </div>
        <ul className="space-y-2 text-sm">
          <li className="flex justify-between">
            <span className="text-slate-500">Total kits</span>
            <span className="font-semibold">{kits.length}</span>
          </li>
          <li className="flex justify-between">
            <span className="text-slate-500">Activos</span>
            <span className="font-semibold text-emerald-600">
              {kits.filter((k) => k.status === 'Activo').length}
            </span>
          </li>
          <li className="flex justify-between">
            <span className="text-slate-500">Productos agrupados</span>
            <span className="font-semibold">
              {kits.reduce((sum, k) => sum + k.items.length, 0)}
            </span>
          </li>
        </ul>
        <p className="mt-4 text-xs text-slate-500">
          Agrupa productos frecuentes para agilizar salidas de inventario en terreno.
        </p>
      </Card>
    </div>
  )
}
