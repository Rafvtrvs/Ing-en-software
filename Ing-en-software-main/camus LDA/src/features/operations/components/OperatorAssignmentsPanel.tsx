import { useEffect, useMemo, useState } from 'react'
import { Calendar, ClipboardList, ExternalLink } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { useOrdersStore } from '@/store/useOrdersStore'
import { useUsersStore } from '@/store/useUsersStore'
import { getOperatorAssignments } from '@/features/operations/utils/operatorAvailability'
import { formatDisplayDate } from '@/features/orders/utils/orderDates'
import type { OrderOperator, WorkOrder } from '@/types'

/**
 * RF60 — CDS 210: Consultar asignaciones de operadores
 */
export function OperatorAssignmentsPanel() {
  const orders = useOrdersStore((s) => s.orders)
  const users = useUsersStore((s) => s.users)
  const roles = useUsersStore((s) => s.roles)
  const openViewModal = useOrdersStore((s) => s.openViewModal)

  const operators: OrderOperator[] = useMemo(() => {
    const techRoleIds = new Set(
      roles
        .filter((r) => {
          const n = r.name.toLowerCase()
          return (
            n.includes('técnico') ||
            n.includes('tecnico') ||
            n.includes('operador') ||
            n.includes('campo')
          )
        })
        .map((r) => r.id),
    )
    return users
      .filter((u) => techRoleIds.has(u.roleId))
      .map((u) => ({ id: u.id, name: u.name }))
  }, [users, roles])

  const [selectedOperatorId, setSelectedOperatorId] = useState('')

  useEffect(() => {
    if (!selectedOperatorId && operators[0]?.id) {
      setSelectedOperatorId(operators[0].id)
    }
  }, [operators, selectedOperatorId])

  const selectedOperator = operators.find((o) => o.id === selectedOperatorId)

  const assignments = useMemo(() => {
    if (!selectedOperator) return []
    return getOperatorAssignments(
      selectedOperator.id,
      selectedOperator.name,
      orders,
    )
  }, [selectedOperator, orders])

  const handleOpenDetail = (order: WorkOrder) => {
    openViewModal(order)
  }

  const columns: Column<WorkOrder>[] = [
    {
      key: 'id',
      header: 'OT',
      className: 'whitespace-nowrap min-w-[120px]',
      render: (row) => <span className="font-medium text-slate-900">{row.id}</span>,
    },
    {
      key: 'client',
      header: 'Cliente',
      className: 'min-w-[140px]',
      render: (row) => <span className="text-slate-700">{row.client}</span>,
    },
    {
      key: 'status',
      header: 'Estado',
      className: 'whitespace-nowrap',
      render: (row) => <Badge label={row.status} context="order" />,
    },
    {
      key: 'startDate',
      header: 'Inicio',
      className: 'whitespace-nowrap',
      render: (row) => (
        <span className="text-slate-600">
          {row.startDate ? formatDisplayDate(row.startDate) : '—'}
        </span>
      ),
    },
    {
      key: 'endDate',
      header: 'Término',
      className: 'whitespace-nowrap',
      render: (row) => (
        <span className="text-slate-600">
          {row.endDate ? formatDisplayDate(row.endDate) : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Acción',
      className: 'whitespace-nowrap text-right',
      render: (row) => (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          leftIcon={<ExternalLink className="h-3.5 w-3.5" />}
          onClick={(e) => {
            e.stopPropagation()
            handleOpenDetail(row)
          }}
        >
          Ver detalle
        </Button>
      ),
    },
  ]

  return (
    <Card className="overflow-hidden">
      <CardHeader
        title="Asignaciones de Operadores"
        subtitle="Revisa las órdenes asignadas a cada operador con estados y fechas."
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="w-full sm:max-w-xs">
          <label className="mb-1.5 block text-xs font-medium text-slate-600">
            Operador
          </label>
          <Select
            value={selectedOperatorId}
            onChange={(e) => setSelectedOperatorId(e.target.value)}
            aria-label="Seleccionar operador"
            className="w-full"
          >
            {operators.length === 0 ? (
              <option value="">Sin operadores</option>
            ) : (
              operators.map((op) => (
                <option key={op.id} value={op.id}>
                  {op.name}
                </option>
              ))
            )}
          </Select>
        </div>
        {selectedOperator && (
          <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5 text-sm text-slate-600">
            <ClipboardList className="h-4 w-4 shrink-0 text-slate-400" />
            <span>
              <strong>{assignments.length}</strong> órdenes asignadas
            </span>
          </div>
        )}
      </div>

      {assignments.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">
          No hay registros para mostrar.
        </p>
      ) : (
        <div className="-mx-2 overflow-x-auto px-2">
          <DataTable
            columns={columns}
            data={assignments}
            keyExtractor={(row) => row.id}
            onRowClick={handleOpenDetail}
          />
        </div>
      )}

      {selectedOperator && assignments.length > 0 && (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
          <Calendar className="h-3.5 w-3.5 shrink-0" />
          Haz clic en una fila o en Ver detalle para abrir la orden de trabajo.
        </p>
      )}
    </Card>
  )
}
