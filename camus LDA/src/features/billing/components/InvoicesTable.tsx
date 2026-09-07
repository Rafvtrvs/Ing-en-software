import { useMemo, useState } from 'react'
import { Eye, Filter, Pencil, Search, Trash2, Upload, X, Wallet } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Pagination } from '@/components/ui/Pagination'
import { Select } from '@/components/ui/Select'
import { useBillingStore } from '@/store/useBillingStore'
import { exportInvoicesToCsv, formatInvoiceAmount } from '@/features/billing/utils/exportBilling'
import { formatShortDate } from '@/utils/formatters'
import type { Invoice, InvoiceStatus } from '@/types'

const PAGE_SIZE = 6

interface InvoicesTableProps {
  onCreateClick?: () => void
}

export function InvoicesTable({ onCreateClick }: InvoicesTableProps) {
  const invoices = useBillingStore((s) => s.invoices)
  const statusFilter = useBillingStore((s) => s.statusFilter)
  const showFilters = useBillingStore((s) => s.showFilters)
  const setStatusFilter = useBillingStore((s) => s.setStatusFilter)
  const toggleFilters = useBillingStore((s) => s.toggleFilters)
  const openViewModal = useBillingStore((s) => s.openViewModal)
  const openEditModal = useBillingStore((s) => s.openEditModal)
  const openDeleteModal = useBillingStore((s) => s.openDeleteModal)
  const openPaymentModal = useBillingStore((s) => s.openPaymentModal)
  const addToast = useBillingStore((s) => s.addToast)

  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return invoices.filter((inv) => {
      const matchesSearch =
        !q ||
        inv.number.toLowerCase().includes(q) ||
        inv.client.toLowerCase().includes(q) ||
        inv.clientRut.includes(q) ||
        (inv.orderId?.toLowerCase().includes(q) ?? false)
      const matchesStatus = statusFilter === 'all' || inv.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [invoices, search, statusFilter])

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
    exportInvoicesToCsv(filtered)
    addToast(`${filtered.length} facturas exportadas a CSV`)
  }

  const columns: Column<Invoice>[] = [
    {
      key: 'number',
      header: 'N° Factura',
      render: (row) => <p className="font-medium text-slate-900">{row.number}</p>,
    },
    { key: 'client', header: 'Cliente' },
    {
      key: 'orderId',
      header: 'Orden',
      render: (row) => row.orderId ?? '—',
    },
    {
      key: 'issueDate',
      header: 'Emisión',
      render: (row) => formatShortDate(row.issueDate),
    },
    {
      key: 'dueDate',
      header: 'Vencimiento',
      render: (row) => formatShortDate(row.dueDate),
    },
    {
      key: 'amount',
      header: 'Monto',
      render: (row) => (
        <span className="font-medium text-slate-900">{formatInvoiceAmount(row.amount)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      render: (row) => {
        const paid = row.paidAmount ?? 0
        const isPartial = paid > 0 && paid < row.amount
        return (
          <div className="flex flex-col gap-1">
            <Badge label={row.status} context="billing" />
            {isPartial && (
              <span className="text-xs text-amber-600">Pago parcial</span>
            )}
          </div>
        )
      },
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
            aria-label={`Ver ${row.number}`}
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => openEditModal(row)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-primary"
            aria-label={`Editar ${row.number}`}
          >
            <Pencil className="h-4 w-4" />
          </button>
          {(row.status === 'Emitida' || row.status === 'Vencida') && (
            <button
              type="button"
              onClick={() => openPaymentModal(row)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600"
              aria-label={`Registrar pago ${row.number}`}
            >
              <Wallet className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => openDeleteModal(row)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
            aria-label={`Eliminar ${row.number}`}
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
        title="Listado de Facturas"
        action={
          onCreateClick ? (
            <Button size="sm" onClick={onCreateClick}>
              Nueva Factura
            </Button>
          ) : undefined
        }
      />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-[200px] flex-1 max-w-md">
          <Input
            placeholder="Buscar por número, cliente u orden..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            icon={<Search className="h-4 w-4" />}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Filter className="h-4 w-4" />}
            onClick={toggleFilters}
          >
            Filtros
          </Button>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Upload className="h-4 w-4" />}
            onClick={handleExport}
          >
            Exportar
          </Button>
        </div>
      </div>

      {showFilters && (
        <div className="mb-4 flex flex-wrap items-end gap-4 rounded-lg border border-slate-100 bg-slate-50 p-4">
          <div className="min-w-[180px]">
            <label className="mb-1.5 block text-xs font-medium text-slate-600">Estado</label>
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as InvoiceStatus | 'all')
                setCurrentPage(1)
              }}
            >
              <option value="all">Todos los estados</option>
              <option value="Borrador">Borrador</option>
              <option value="Emitida">Emitida</option>
              <option value="Pagada">Pagada</option>
              <option value="Vencida">Vencida</option>
              <option value="Anulada">Anulada</option>
            </Select>
          </div>
          {statusFilter !== 'all' && (
            <button
              type="button"
              onClick={() => {
                setStatusFilter('all')
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
          No se encontraron facturas con los criterios seleccionados.
        </p>
      ) : (
        <>
          <DataTable columns={columns} data={paginated} keyExtractor={(row) => row.id} />
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filtered.length}
            pageSize={PAGE_SIZE}
          />
        </>
      )}
    </Card>
  )
}
