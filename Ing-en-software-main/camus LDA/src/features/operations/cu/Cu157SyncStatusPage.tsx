import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { CuPageBanner } from '@/components/ui/CuPageBanner'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { ROUTES } from '@/constants/routes'
import { useOperationsStore } from '@/store/useOperationsStore'
import type { OfflineSyncEntry } from '@/types'
import { formatDateTime } from '@/utils/formatters'

/** RF46 — CU-157: Consultar estado de sincronización */
export function Cu157SyncStatusPage() {
  const navigate = useNavigate()
  const syncEntries = useOperationsStore((s) => s.syncEntries)

  const columns: Column<OfflineSyncEntry>[] = [
    { key: 'module', header: 'Módulo' },
    { key: 'summary', header: 'Resumen', className: 'max-w-[280px]' },
    {
      key: 'status',
      header: 'Estado',
      render: (row) => {
        const label =
          row.status === 'pendiente'
            ? 'Pendiente'
            : row.status === 'sincronizado'
              ? 'Actualizado'
              : 'Error'
        const cls =
          row.status === 'pendiente'
            ? 'bg-amber-50 text-amber-700 ring-amber-600/20'
            : row.status === 'sincronizado'
              ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
              : 'bg-red-50 text-red-700 ring-red-600/20'
        return <Badge label={label} className={cls} />
      },
    },
    {
      key: 'createdAt',
      header: 'Fecha',
      render: (row) => (
        <span className="text-sm text-slate-600">{formatDateTime(row.createdAt)}</span>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Operaciones en Terreno"
        subtitle="Vista dedicada al caso de uso CU-157."
        action={
          <Button variant="outline" onClick={() => navigate(ROUTES.OPERACIONES)}>
            Volver al panel general
          </Button>
        }
      />

      <CuPageBanner
        rf="RF46"
        rfTitle="Registro sin conexión y sincronización"
        cu="CU-157"
        cuTitle="Consultar estado de sincronización de registros"
      />

      <Card className="p-4 sm:p-6">
        {syncEntries.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">No hay registros para mostrar.</p>
        ) : (
          <DataTable columns={columns} data={syncEntries} keyExtractor={(r) => r.id} />
        )}
      </Card>
    </div>
  )
}
