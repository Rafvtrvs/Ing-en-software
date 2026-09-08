import { useMemo, useState } from 'react'
import { Check, Eye, X } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { useOrdersStore } from '@/store/useOrdersStore'
import { useSessionUser } from '@/features/auth/useSessionUser'
import { formatDisplayDate } from '@/features/orders/utils/orderDates'
import type { ModificationRequestStatus, OrderModificationRequest } from '@/types'

const statusStyles: Record<ModificationRequestStatus, string> = {
  Pendiente: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  Aprobada: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  Rechazada: 'bg-red-50 text-red-700 ring-red-600/20',
}

/** RF68 — CDS 234: Verificación de solicitudes de modificación */
export function ModificationRequestsPanel() {
  const requests = useOrdersStore((s) => s.modificationRequests)
  const approveModificationRequest = useOrdersStore((s) => s.approveModificationRequest)
  const rejectModificationRequest = useOrdersStore((s) => s.rejectModificationRequest)
  const openViewModal = useOrdersStore((s) => s.openViewModal)
  const orders = useOrdersStore((s) => s.orders)
  const addToast = useOrdersStore((s) => s.addToast)
  const currentUser = useSessionUser()

  const [statusFilter, setStatusFilter] = useState<ModificationRequestStatus | 'all'>('all')
  const [selected, setSelected] = useState<OrderModificationRequest | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [detailOpen, setDetailOpen] = useState(false)

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return requests
    return requests.filter((r) => r.status === statusFilter)
  }, [requests, statusFilter])

  const columns: Column<OrderModificationRequest>[] = [
    { key: 'orderId', header: 'Orden', className: 'font-medium' },
    { key: 'operatorName', header: 'Operador' },
    {
      key: 'requestedAt',
      header: 'Fecha solicitud',
      render: (row) => formatDisplayDate(row.requestedAt.slice(0, 10)),
    },
    {
      key: 'status',
      header: 'Estado',
      render: (row) => (
        <Badge label={row.status} className={statusStyles[row.status]} />
      ),
    },
    {
      key: 'actions',
      header: 'Acción',
      render: (row) => (
        <Button
          size="sm"
          variant="outline"
          leftIcon={<Eye className="h-3.5 w-3.5" />}
          onClick={() => {
            setSelected(row)
            setRejectReason('')
            setDetailOpen(true)
          }}
        >
          Ver
        </Button>
      ),
    },
  ]

  const handleApprove = () => {
    if (!selected) return
    const result = approveModificationRequest(selected.id, {
      id: currentUser.id ?? 'session',
      name: currentUser.name ?? 'Administrador',
    })
    if (!result.ok) {
      addToast(result.message ?? 'Error', 'error')
      return
    }
    setDetailOpen(false)
    setSelected(null)
  }

  const handleReject = () => {
    if (!selected) return
    const result = rejectModificationRequest(
      selected.id,
      rejectReason,
      {
        id: currentUser.id ?? 'session',
        name: currentUser.name ?? 'Administrador',
      },
    )
    if (!result.ok) {
      addToast(result.message ?? 'Error', 'error')
      return
    }
    setDetailOpen(false)
    setSelected(null)
  }

  return (
    <>
      <Card>
        <CardHeader
          title="Solicitudes de modificación"
          subtitle="Revisión y aprobación de cambios solicitados por operadores."
        />
        <div className="mb-4 min-w-[180px] max-w-xs">
          <label className="mb-1.5 block text-xs font-medium text-slate-600">Estado</label>
          <Select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as ModificationRequestStatus | 'all')
            }
          >
            <option value="all">Todos</option>
            <option value="Pendiente">Pendiente</option>
            <option value="Aprobada">Aprobada</option>
            <option value="Rechazada">Rechazada</option>
          </Select>
        </div>
        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            No existen solicitudes pendientes.
          </p>
        ) : (
          <DataTable
            columns={columns}
            data={filtered}
            keyExtractor={(r) => r.id}
            tableClassName="min-w-[640px]"
          />
        )}
      </Card>

      <Modal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        title="Detalle de solicitud"
        size="md"
        footer={
          selected?.status === 'Pendiente' ? (
            <>
              <Button variant="outline" onClick={() => setDetailOpen(false)}>
                Cerrar
              </Button>
              <Button
                variant="outline"
                className="border-red-200 text-red-600"
                leftIcon={<X className="h-4 w-4" />}
                onClick={handleReject}
                disabled={!rejectReason.trim()}
              >
                Rechazar
              </Button>
              <Button leftIcon={<Check className="h-4 w-4" />} onClick={handleApprove}>
                Aprobar
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => setDetailOpen(false)}>
              Cerrar
            </Button>
          )
        }
      >
        {selected && (
          <div className="space-y-3 text-sm">
            <p>
              <span className="text-slate-500">Orden:</span>{' '}
              <button
                type="button"
                className="font-medium text-primary hover:underline"
                onClick={() => {
                  const order = orders.find((o) => o.id === selected.orderId)
                  if (order) {
                    setDetailOpen(false)
                    openViewModal(order)
                  }
                }}
              >
                {selected.orderId}
              </button>
            </p>
            <p>
              <span className="text-slate-500">Operador:</span> {selected.operatorName}
            </p>
            <p>
              <span className="text-slate-500">Campos:</span> {selected.fieldsToModify}
            </p>
            <p>
              <span className="text-slate-500">Motivo:</span> {selected.reason}
            </p>
            <Badge label={selected.status} className={statusStyles[selected.status]} />
            {selected.status === 'Pendiente' && (
              <div className="pt-2">
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Motivo de rechazo (si aplica)
                </label>
                <textarea
                  rows={2}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Obligatorio para rechazar..."
                />
              </div>
            )}
            {selected.rejectionReason && (
              <p className="text-red-600">
                <strong>Rechazo:</strong> {selected.rejectionReason}
              </p>
            )}
          </div>
        )}
      </Modal>
    </>
  )
}
