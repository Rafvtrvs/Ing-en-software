import { useMemo, useState } from 'react'
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
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return kits.filter(
      (k) =>
        !q ||
        k.name.toLowerCase().includes(q) ||
        k.description.toLowerCase().includes(q),
    )
  }, [kits, search])

  const columns: Column<ProductKit & { itemCount: number }>[] = [
    { key: 'name', header: 'Kit / Paquete', className: 'font-medium text-slate-900' },
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
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => openKitModal('edit', row)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-amber-600"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => openKitModal('delete', row)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-red-500"
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
              placeholder="Buscar kit..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search className="h-4 w-4" />}
            />
          </div>
          <DataTable columns={columns} data={rows} keyExtractor={(r) => r.id} />
        </Card>
      </div>
      <Card>
        <CardHeader title="Resumen de Kits" />
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
          <Package className="h-6 w-6 text-blue-600" />
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
        </ul>
        <p className="mt-4 text-xs text-slate-500">
          Agrupa productos frecuentes para agilizar salidas de inventario en terreno.
        </p>
      </Card>
    </div>
  )
}
