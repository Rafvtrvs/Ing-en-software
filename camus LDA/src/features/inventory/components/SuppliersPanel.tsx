import { useMemo, useState } from 'react'
import { Eye, Mail, Pencil, Phone, Plus, Search, Trash2 } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useInventoryStore } from '@/store/useInventoryStore'
import type { Supplier } from '@/types'

export function SuppliersPanel() {
  const suppliers = useInventoryStore((s) => s.suppliers)
  const openSupplierModal = useInventoryStore((s) => s.openSupplierModal)
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return suppliers.filter(
      (s) =>
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.rut.includes(q) ||
        s.contact.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q),
    )
  }, [suppliers, search])

  const columns: Column<Supplier>[] = [
    { key: 'name', header: 'Proveedor', className: 'font-medium text-slate-900' },
    { key: 'rut', header: 'RUT' },
    { key: 'contact', header: 'Contacto' },
    {
      key: 'phone',
      header: 'Teléfono',
      render: (row) => (
        <span className="inline-flex items-center gap-1 text-slate-600">
          <Phone className="h-3.5 w-3.5 text-slate-400" />
          {row.phone}
        </span>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      render: (row) => (
        <span className="inline-flex items-center gap-1 text-slate-600">
          <Mail className="h-3.5 w-3.5 text-slate-400" />
          {row.email}
        </span>
      ),
    },
    { key: 'paymentTerms', header: 'Cond. Pago' },
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
            onClick={() => openSupplierModal('view', row)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-primary"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => openSupplierModal('edit', row)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-amber-600"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => openSupplierModal('delete', row)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-red-500"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader
            title="Proveedores"
            action={
              <Button
                size="sm"
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={() => openSupplierModal('create')}
              >
                Nuevo Proveedor
              </Button>
            }
          />
          <div className="mb-4">
            <Input
              placeholder="Buscar proveedor, RUT, contacto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search className="h-4 w-4" />}
            />
          </div>
          <DataTable
            columns={columns}
            data={filtered}
            keyExtractor={(r) => r.id}
            className="min-w-[800px]"
          />
        </Card>
      </div>

      <Card>
        <CardHeader title="Resumen de Proveedores" />
        <ul className="space-y-3 text-sm">
          <li className="flex justify-between">
            <span className="text-slate-500">Total registrados</span>
            <span className="font-semibold">{suppliers.length}</span>
          </li>
          <li className="flex justify-between">
            <span className="text-slate-500">Activos</span>
            <span className="font-semibold text-emerald-600">
              {suppliers.filter((s) => s.status === 'Activo').length}
            </span>
          </li>
          <li className="flex justify-between">
            <span className="text-slate-500">Inactivos</span>
            <span className="font-semibold text-slate-600">
              {suppliers.filter((s) => s.status === 'Inactivo').length}
            </span>
          </li>
        </ul>
      </Card>
    </div>
  )
}
