import { useState } from 'react'
import { MapPin, Save } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useOrdersStore } from '@/store/useOrdersStore'
import { useSessionUser } from '@/features/auth/useSessionUser'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'

/**
 * RF-43 CU-147/148 — registrar y completar OT desde terreno (operador).
 * Formularios compactos para móvil (RF-36 CU-122).
 */
export function FieldOrderPanel() {
  const user = useSessionUser()
  const { reducedData } = useNetworkStatus()
  const createFieldOrder = useOrdersStore((s) => s.createFieldOrder)
  const completeFieldOrderForm = useOrdersStore((s) => s.completeFieldOrderForm)
  const openViewModal = useOrdersStore((s) => s.openViewModal)
  const orders = useOrdersStore((s) => s.orders)

  const [client, setClient] = useState('')
  const [address, setAddress] = useState('')
  const [service, setService] = useState('')
  const [category, setCategory] = useState('Mantención')
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)

  const [completeId, setCompleteId] = useState('')
  const [progress, setProgress] = useState(100)
  const [endDate, setEndDate] = useState(
    () => new Date().toISOString().slice(0, 10),
  )

  const myActive = orders.filter(
    (o) =>
      (o.technician === user.name ||
        o.operators?.some((op) => op.name === user.name)) &&
      (o.status === 'Pendiente' || o.status === 'En Curso'),
  )

  const handleCreate = () => {
    if (!client.trim() || !address.trim() || !service.trim()) {
      useOrdersStore
        .getState()
        .addToast('Completa cliente, dirección y descripción del servicio', 'error')
      return
    }
    setBusy(true)
    try {
      const order = createFieldOrder({
        client,
        address,
        service,
        category,
        technician: user.name ?? 'Operador',
        notes,
      })
      setClient('')
      setAddress('')
      setService('')
      setNotes('')
      openViewModal(order)
    } finally {
      setBusy(false)
    }
  }

  const handleComplete = () => {
    if (!completeId) {
      useOrdersStore.getState().addToast('Selecciona una orden activa', 'error')
      return
    }
    completeFieldOrderForm(completeId, {
      endDate,
      progress,
      durationHours: 1,
    })
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <MapPin className="h-4 w-4 text-emerald-700" />
          <div>
            <p className="text-sm font-semibold text-emerald-950">
              Registrar OT en terreno
            </p>
            <p className="text-xs text-emerald-800">
              Formulario adaptado a móvil
              {reducedData ? ' · modo datos reducidos' : ''}
            </p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="Cliente" required>
            <Input
              value={client}
              onChange={(e) => setClient(e.target.value)}
              placeholder="Nombre del cliente"
              autoComplete="organization"
            />
          </FormField>
          <FormField label="Categoría">
            <Select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option>Mantención</option>
              <option>Obstrucción</option>
              <option>Fuga</option>
              <option>Urgencia</option>
              <option>Otros</option>
            </Select>
          </FormField>
          <FormField label="Dirección" required className="sm:col-span-2">
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Calle, número, comuna"
            />
          </FormField>
          <FormField label="Descripción del servicio" required className="sm:col-span-2">
            <textarea
              value={service}
              onChange={(e) => setService(e.target.value)}
              rows={reducedData ? 2 : 3}
              placeholder="Qué se está realizando en terreno"
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </FormField>
          {!reducedData && (
            <FormField label="Notas" className="sm:col-span-2">
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Opcional"
              />
            </FormField>
          )}
        </div>
        <Button
          type="button"
          className="mt-3"
          leftIcon={<Save className="h-4 w-4" />}
          disabled={busy}
          onClick={handleCreate}
        >
          {busy ? 'Guardando…' : 'Registrar orden en terreno'}
        </Button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="mb-2 text-sm font-semibold text-slate-900">
          Completar formulario de OT en terreno
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          <FormField label="Orden activa">
            <Select
              value={completeId}
              onChange={(e) => setCompleteId(e.target.value)}
            >
              <option value="">Seleccionar…</option>
              {myActive.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.id} — {o.client}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Fecha término">
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </FormField>
          <FormField label="Progreso %">
            <Input
              type="number"
              min={0}
              max={100}
              value={progress}
              onChange={(e) => setProgress(Number(e.target.value) || 0)}
            />
          </FormField>
        </div>
        <Button type="button" className="mt-3" variant="outline" onClick={handleComplete}>
          Guardar avance en terreno
        </Button>
      </div>
    </div>
  )
}
