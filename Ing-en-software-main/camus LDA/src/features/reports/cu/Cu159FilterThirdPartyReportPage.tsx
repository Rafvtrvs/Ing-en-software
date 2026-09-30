import { useNavigate } from 'react-router-dom'
import { Filter, Search } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { CuPageBanner } from '@/components/ui/CuPageBanner'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { ROUTES } from '@/constants/routes'
import { useThirdPartyFilterDraft } from '@/features/reports/hooks/useThirdPartyFilterDraft'
import type { ThirdPartyReportRow } from '@/types'

export function Cu159FilterThirdPartyReportPage() {
  const navigate = useNavigate()
  const {
    rows,
    companies,
    orderOptions,
    draft,
    patchDraft,
    applyFilter,
    clearFilters,
    hasFiltered,
    filtered,
  } = useThirdPartyFilterDraft()

  const columns: Column<ThirdPartyReportRow>[] = [
    { key: 'orderId', header: 'OT' },
    { key: 'client', header: 'Cliente' },
    { key: 'company', header: 'Empresa tercero' },
    { key: 'detail', header: 'Detalle', className: 'max-w-[240px]' },
    { key: 'registeredAt', header: 'Fecha registro' },
  ]

  const tableData = hasFiltered ? filtered : rows

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reportes"
        subtitle="Vista dedicada al caso de uso CU-159."
        action={
          <Button onClick={() => navigate(ROUTES.CU158)}>Ir a CU-158 — Generar reporte</Button>
        }
      />

      <CuPageBanner
        rf="RF47"
        rfTitle="Reporte de intervenciones de terceros"
        cu="CU-159"
        cuTitle="Filtrar reporte de intervenciones de terceros"
      />

      <Card className="p-4 sm:p-6">
        <p className="mb-4 text-sm text-slate-600">
          Complete los criterios y pulse <strong>Filtrar</strong>. La tabla se actualiza solo después de
          ese paso (no filtra mientras escribe).
        </p>
        <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="min-w-[200px] flex-1">
            <label className="mb-1.5 block text-xs font-medium text-slate-600">Búsqueda</label>
            <Input
              value={draft.search}
              onChange={(e) => patchDraft({ search: e.target.value })}
              placeholder="Empresa, detalle, cliente u OT..."
              icon={<Search className="h-4 w-4" />}
            />
          </div>
          <div className="min-w-[160px]">
            <label className="mb-1.5 block text-xs font-medium text-slate-600">Empresa</label>
            <Select
              value={draft.companyFilter}
              onChange={(e) => patchDraft({ companyFilter: e.target.value })}
            >
              <option value="all">Todas</option>
              {companies.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </div>
          <div className="min-w-[160px]">
            <label className="mb-1.5 block text-xs font-medium text-slate-600">Orden de trabajo</label>
            <Select
              value={draft.orderFilter}
              onChange={(e) => patchDraft({ orderFilter: e.target.value })}
            >
              <option value="all">Todas</option>
              {orderOptions.map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button leftIcon={<Filter className="h-4 w-4" />} onClick={applyFilter}>
              Filtrar
            </Button>
            <Button variant="outline" onClick={clearFilters}>
              Limpiar
            </Button>
          </div>
        </div>

        {tableData.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">
            {rows.length === 0
              ? 'No hay intervenciones de terceros registradas.'
              : 'No hay registros con los filtros aplicados.'}
          </p>
        ) : (
          <DataTable columns={columns} data={tableData} keyExtractor={(r) => r.id} />
        )}
      </Card>
    </div>
  )
}
