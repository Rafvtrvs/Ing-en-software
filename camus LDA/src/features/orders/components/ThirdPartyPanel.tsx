import { useMemo, useState, type FormEvent } from 'react'
import { Building2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { useOrdersStore } from '@/store/useOrdersStore'
import type { ThirdPartyIntervention, WorkOrder } from '@/types'

/** CU-188–192: terceros en OT, fotos URL y stats mensuales (vía página) */
export function ThirdPartyPanel({
  order,
  canEdit = true,
}: {
  order: WorkOrder
  canEdit?: boolean
}) {
  const addThirdParty = useOrdersStore((s) => s.addThirdParty)
  const [company, setCompany] = useState('')
  const [detail, setDetail] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [open, setOpen] = useState(false)

  const items = order.thirdParties ?? []

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!canEdit) return
    if (!company.trim() || !detail.trim()) return
    addThirdParty(order.id, {
      company: company.trim(),
      detail: detail.trim(),
      photoUrls: photoUrl.trim() ? [photoUrl.trim()] : [],
    })
    setCompany('')
    setDetail('')
    setPhotoUrl('')
    setOpen(false)
  }

  const columns: Column<ThirdPartyIntervention>[] = [
    { key: 'company', header: 'Empresa', className: 'font-medium text-slate-900' },
    { key: 'detail', header: 'Detalle' },
    {
      key: 'photoUrls',
      header: 'Fotos',
      render: (row) =>
        row.photoUrls.length
          ? row.photoUrls.map((u) => (
              <a
                key={u}
                href={u}
                target="_blank"
                rel="noreferrer"
                className="mr-1 text-xs text-primary hover:underline"
              >
                ver
              </a>
            ))
          : '—',
    },
    {
      key: 'registeredAt',
      header: 'Fecha',
      render: (row) =>
        new Date(row.registeredAt).toLocaleDateString('es-CL'),
    },
  ]

  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-slate-400" />
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Intervenciones de terceros
            </p>
            <p className="text-xs text-slate-500">
              Empresas externas vinculadas a esta OT
            </p>
          </div>
        </div>
        {canEdit && !open && (
          <Button type="button" variant="outline" onClick={() => setOpen(true)}>
            Registrar tercero
          </Button>
        )}
      </div>

      {open && (
        <form onSubmit={handleSubmit} className="mb-4 space-y-3 rounded-lg border border-primary/20 bg-slate-50/50 p-3">
          <FormField label="Empresa" htmlFor={`tp-co-${order.id}`} required>
            <Input
              id={`tp-co-${order.id}`}
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Nombre del tercero"
            />
          </FormField>
          <FormField label="Detalle" htmlFor={`tp-dt-${order.id}`} required>
            <textarea
              id={`tp-dt-${order.id}`}
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </FormField>
          <FormField label="Foto (URL)" htmlFor={`tp-ph-${order.id}`}>
            <Input
              id={`tp-ph-${order.id}`}
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="https://…"
            />
          </FormField>
          <div className="flex gap-2">
            <Button type="submit">Guardar</Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      )}

      {items.length === 0 ? (
        <p className="text-sm text-slate-500">Sin intervenciones de terceros.</p>
      ) : (
        <DataTable
          columns={columns}
          data={items}
          keyExtractor={(r) => r.id}
        />
      )}
    </div>
  )
}

/** Stats mensuales de terceros a nivel página (CU-192) */
export function ThirdPartyMonthlyStats({ orders }: { orders: WorkOrder[] }) {
  const stats = useMemo(() => {
    const map = new Map<string, number>()
    for (const o of orders) {
      for (const t of o.thirdParties ?? []) {
        const d = new Date(t.registeredAt)
        if (Number.isNaN(d.getTime())) continue
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        map.set(key, (map.get(key) ?? 0) + 1)
      }
    }
    return [...map.entries()]
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 6)
  }, [orders])

  if (stats.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
        Aún no hay intervenciones de terceros este período.
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold text-slate-900">
        Terceros por mes
      </p>
      <p className="mb-3 text-xs text-slate-500">
        Cantidad de intervenciones externas registradas
      </p>
      <ul className="space-y-2">
        {stats.map(([month, count]) => (
          <li
            key={month}
            className="flex items-center justify-between text-sm text-slate-700"
          >
            <span>{month}</span>
            <span className="font-semibold text-slate-900">{count}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
