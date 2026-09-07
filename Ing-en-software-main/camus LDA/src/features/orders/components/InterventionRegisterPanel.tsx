import { useState, type FormEvent } from 'react'
import { ClipboardPlus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { useOrdersStore } from '@/store/useOrdersStore'

/** Formulario CU-149: registrar intervención del servicio en una OT */
export function InterventionRegisterPanel({ orderId }: { orderId: string }) {
  const addIntervention = useOrdersStore((s) => s.addIntervention)
  const addToast = useOrdersStore((s) => s.addToast)
  const [open, setOpen] = useState(false)
  const [detail, setDetail] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const trimmed = detail.trim()
    if (!trimmed) {
      setError('Ingresa la descripción de la intervención')
      return
    }
    setError('')
    setSaving(true)
    try {
      await addIntervention(orderId, trimmed)
      setDetail('')
      setOpen(false)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'No se pudo registrar la intervención'
      setError(message)
      addToast(message, 'error')
    } finally {
      setSaving(false)
    }
  }

  if (!open) {
    return (
      <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">Intervenciones</p>
            <p className="mt-0.5 text-xs text-slate-500">
              Registra las acciones realizadas durante el servicio
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            leftIcon={<ClipboardPlus className="h-4 w-4" />}
            onClick={() => setOpen(true)}
          >
            Registrar intervención
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-primary/20 bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold text-slate-900">Registrar intervención</p>
      <p className="mt-0.5 text-xs text-slate-500">
        Describe la acción efectuada en esta orden de trabajo
      </p>
      <form onSubmit={handleSubmit} className="mt-3 space-y-3">
        <FormField
          label="Descripción"
          htmlFor={`intervention-detail-${orderId}`}
          required
          error={error}
        >
          <textarea
            id={`intervention-detail-${orderId}`}
            value={detail}
            onChange={(e) => {
              setDetail(e.target.value)
              if (error) setError('')
            }}
            rows={3}
            maxLength={255}
            placeholder="Ej: Destape de tubería principal en cámara de inspección"
            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </FormField>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar intervención'}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={saving}
            onClick={() => {
              setOpen(false)
              setDetail('')
              setError('')
            }}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  )
}
