import { Card, CardHeader } from '@/components/ui/Card'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { useSupportStore } from '@/store/useSupportStore'
import { formatShortDate } from '@/utils/formatters'
import type { SupportTicket } from '@/types'
import { cn } from '@/utils/cn'

const statusStyles: Record<string, string> = {
  Abierto: 'bg-blue-50 text-blue-700',
  'En Proceso': 'bg-amber-50 text-amber-700',
  Resuelto: 'bg-emerald-50 text-emerald-700',
  Cerrado: 'bg-slate-100 text-slate-600',
}

const priorityStyles: Record<string, string> = {
  Baja: 'text-slate-600',
  Media: 'text-amber-600',
  Alta: 'text-red-600',
}

export function SupportTicketsTable() {
  const tickets = useSupportStore((s) => s.tickets)

  const columns: Column<SupportTicket>[] = [
    {
      key: 'id',
      header: 'Ticket',
      render: (row) => <span className="font-medium text-primary">{row.id}</span>,
    },
    {
      key: 'subject',
      header: 'Asunto',
      render: (row) => <span className="font-medium text-slate-900">{row.subject}</span>,
    },
    {
      key: 'priority',
      header: 'Prioridad',
      render: (row) => (
        <span className={cn('text-sm font-semibold', priorityStyles[row.priority])}>
          {row.priority}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      render: (row) => (
        <span
          className={cn(
            'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
            statusStyles[row.status],
          )}
        >
          {row.status}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Creado',
      render: (row) => formatShortDate(row.createdAt),
    },
    {
      key: 'updatedAt',
      header: 'Actualizado',
      render: (row) => formatShortDate(row.updatedAt),
    },
  ]

  return (
    <Card>
      <CardHeader
        title="Mis Tickets de Soporte"
        subtitle="Historial de solicitudes enviadas al equipo técnico."
      />
      {tickets.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">No tienes tickets registrados.</p>
      ) : (
        <DataTable columns={columns} data={tickets} keyExtractor={(row) => row.id} />
      )}
    </Card>
  )
}
