import { useEffect, useState, type FormEvent } from 'react'
import { History, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { useOrdersStore } from '@/store/useOrdersStore'
import type { OrderIntervention } from '@/types'

const EMPTY_INTERVENTIONS: OrderIntervention[] = []

/** CU-150 / CU-151: historial de intervenciones + edición */
export function InterventionHistoryPanel({
  orderId,
  canEdit = true,
}: {
  orderId: string
  canEdit?: boolean
}) {
  const interventions = useOrdersStore(
    (s) => s.interventionsByOrderId[orderId] ?? EMPTY_INTERVENTIONS,
  )
  const fetchInterventions = useOrdersStore((s) => s.fetchInterventions)
  const updateIntervention = useOrdersStore((s) => s.updateIntervention)
  const addToast = useOrdersStore((s) => s.addToast)

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editDetail, setEditDetail] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    void fetchInterventions(orderId)
  }, [orderId, fetchInterventions])

  const startEdit = (item: OrderIntervention) => {
    if (!canEdit) {
      addToast('No tienes permiso para editar intervenciones de esta OT', 'error')
      return
    }
    setEditingId(item.id)
    setEditDetail(item.detail)
    setError('')
  }

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    if (editingId == null) return
    const trimmed = editDetail.trim()
    if (!trimmed) {
      setError('La descripción es obligatoria')
      return
    }
    setSaving(true)
    try {
      await updateIntervention(orderId, editingId, trimmed)
      setEditingId(null)
      setEditDetail('')
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'No se pudo actualizar'
      setError(message)
      addToast(message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const columns: Column<OrderIntervention>[] = [
    {
      key: 'id',
      header: 'ID',
      className: 'w-16 font-medium text-slate-900',
      render: (row) => `#${row.id}`,
    },
    {
      key: 'detail',
      header: 'Descripción',
      render: (row) =>
        editingId === row.id ? (
          <form onSubmit={handleSave} className="space-y-2">
            <FormField label="Editar descripción" htmlFor={`edit-int-${row.id}`} error={error}>
              <textarea
                id={`edit-int-${row.id}`}
                value={editDetail}
                onChange={(ev) => setEditDetail(ev.target.value)}
                rows={2}
                maxLength={255}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </FormField>
            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>
                {saving ? 'Guardando…' : 'Guardar'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditingId(null)
                  setError('')
                }}
              >
                Cancelar
              </Button>
            </div>
          </form>
        ) : (
          <span className="text-sm text-slate-700">{row.detail}</span>
        ),
    },
    {
      key: 'updatedAt',
      header: 'Actualizado',
      render: (row) => (
        <span className="text-xs text-slate-500">
          {row.updatedAt ?? row.createdAt ?? '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (row) =>
        editingId === row.id || !canEdit ? null : (
          <button
            type="button"
            onClick={() => startEdit(row)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-amber-600"
            aria-label={`Editar intervención ${row.id}`}
          >
            <Pencil className="h-4 w-4" />
          </button>
        ),
    },
  ]

  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <History className="h-4 w-4 text-slate-400" />
        <div>
          <p className="text-sm font-semibold text-slate-900">
            Historial de intervenciones
          </p>
          <p className="text-xs text-slate-500">
            Listado y edición de acciones del servicio
          </p>
        </div>
      </div>
      {interventions.length === 0 ? (
        <p className="py-4 text-center text-sm text-slate-500">
          Aún no hay intervenciones registradas.
        </p>
      ) : (
        <DataTable
          columns={columns}
          data={interventions}
          keyExtractor={(r) => String(r.id)}
        />
      )}
    </div>
  )
}
