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

  const activeCount = suppliers.filter((s) => s.status === 'Activo').length
  const inactiveCount = suppliers.filter((s) => s.status === 'Inactivo').length

  const columns: Column<Supplier>[] = [
    {
      key: 'name',
      header: 'Proveedor',
      className: 'min-w-[180px]',
      render: (row) => <span className="font-medium text-slate-900">{row.name}</span>,
    },
    {
      key: 'rut',
      header: 'RUT',
      className: 'whitespace-nowrap min-w-[120px]',
    },
    {
      key: 'contact',
      header: 'Contacto',
      className: 'min-w-[120px]',
    },
    {
      key: 'phone',
      header: 'Teléfono',
      className: 'whitespace-nowrap min-w-[140px]',
      render: (row) => (
        <span className="inline-flex items-center gap-1.5 text-slate-600">
          <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          {row.phone}
        </span>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      className: 'min-w-[180px] max-w-[220px]',
      render: (row) => (
        <span
          className="inline-flex max-w-[200px] items-center gap-1.5 truncate text-slate-600"
          title={row.email}
        >
          <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <span className="truncate">{row.email}</span>
        </span>
      ),
    },
    {
      key: 'paymentTerms',
      header: 'Cond. Pago',
      className: 'whitespace-nowrap min-w-[130px]',
    },
    {
      key: 'status',
      header: 'Estado',
      className: 'whitespace-nowrap min-w-[100px]',
      render: (row) => <Badge label={row.status} context="client" />,
    },
    {
      key: 'actions',
      header: 'Acciones',
      className: 'whitespace-nowrap min-w-[132px] text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-0.5">
          <button
            type="button"
            onClick={() => openSupplierModal('view', row)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-primary"
            aria-label={`Ver ${row.name}`}
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => openSupplierModal('edit', row)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-amber-600"
            aria-label={`Editar ${row.name}`}
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => openSupplierModal('delete', row)}
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
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
          <p className="text-xs font-medium uppercase text-slate-500">Total registrados</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{suppliers.length}</p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
          <p className="text-xs font-medium uppercase text-emerald-700">Activos</p>
          <p className="mt-1 text-2xl font-bold text-emerald-900">{activeCount}</p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
          <p className="text-xs font-medium uppercase text-slate-500">Inactivos</p>
          <p className="mt-1 text-2xl font-bold text-slate-700">{inactiveCount}</p>
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardHeader
          title="Proveedores"
          subtitle="Administra contactos, condiciones de pago y estado de cada proveedor."
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
        <div className="mb-4 max-w-md">
          <Input
            placeholder="Buscar proveedor, RUT, contacto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="h-4 w-4" />}
          />
        </div>

        {filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">
            No hay registros para mostrar.
          </p>
        ) : (
          <div className="rounded-lg border border-slate-100">
            <DataTable
              columns={columns}
              data={filtered}
              keyExtractor={(r) => r.id}
              tableClassName="min-w-[980px]"
            />
          </div>
        )}
      </Card>
    </div>
  )
}
