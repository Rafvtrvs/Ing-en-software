import { useRef, useState, type FormEvent } from 'react'
import { ArrowLeft, Camera, MapPin, Play, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { OrderLocationCard } from '@/features/orders/components/OrderLocationCard'
import { compressImage, type NewFieldAction } from '@/features/field/utils/fieldQueue'
import type { WorkOrder } from '@/types'

const NOTE_MAX = 230
/** CU-118: el servidor solo acepta evidencia con la OT en ejecución o finalizada */
const PHOTO_STATUSES: WorkOrder['status'][] = ['En Curso', 'Completada', 'Abonado']

/** Detalle de una OT asignada en la vista móvil (CU-116, CU-117, CU-118) */
export function FieldOrderView({
  order,
  onBack,
  onAction,
}: {
  order: WorkOrder
  onBack: () => void
  /** Encola y envía la acción; devuelve un mensaje para el usuario */
  onAction: (action: NewFieldAction) => Promise<string>
}) {
  const [showLocation, setShowLocation] = useState(false)
  const [note, setNote] = useState('')
  const [feedback, setFeedback] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [signature, setSignature] = useState('')
  const cameraRef = useRef<HTMLInputElement>(null)

  const run = async (action: NewFieldAction) => {
    setBusy(true)
    try {
      setFeedback(await onAction(action))
    } finally {
      setBusy(false)
    }
  }

  const submitNote = async (e: FormEvent) => {
    e.preventDefault()
    const detail = note.trim()
    if (!detail) return
    await run({ kind: 'note', orderId: order.id, detail })
    setNote('')
  }

  const takePhoto = async (file?: File) => {
    if (!file) return
    setBusy(true)
    try {
      const img = await compressImage(file)
      setFeedback(await onAction({ kind: 'photo', orderId: order.id, ...img }))
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'No se pudo procesar la foto')
    } finally {
      setBusy(false)
      if (cameraRef.current) cameraRef.current.value = ''
    }
  }

  const canPhoto = PHOTO_STATUSES.includes(order.status)

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1 text-sm font-medium text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Mis órdenes
      </button>

      <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
        <p className="text-xs text-slate-500">{order.id}</p>
        <p className="text-base font-semibold text-slate-900">{order.client}</p>
        <p className="text-sm text-slate-600">{order.service || order.category}</p>
        <p className="mt-1 text-sm">
          Estado: <strong>{order.status}</strong>
        </p>
      </div>

      {/* CU-116 */}
      <Button
        variant="outline"
        className="w-full"
        leftIcon={<MapPin className="h-4 w-4" />}
        onClick={() => setShowLocation((v) => !v)}
      >
        {showLocation ? 'Ocultar ubicación' : 'Ver ubicación'}
      </Button>
      {showLocation && <OrderLocationCard order={order} />}

      <div className="space-y-2">
        <Button
          className="w-full"
          leftIcon={<Play className="h-4 w-4" />}
          disabled={busy || order.status !== 'Pendiente' || Boolean(order.serviceStartedAt)}
          onClick={() => void run({ kind: 'start-service', orderId: order.id })}
        >
          Comenzar Servicio
        </Button>
        {order.status === 'En Curso' && (
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Firma del cliente</span>
            <input
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-base"
              placeholder="Nombre de quien recibe"
            />
          </label>
        )}
        <Button
          className="w-full"
          variant="secondary"
          leftIcon={<CheckCircle2 className="h-4 w-4" />}
          disabled={busy || order.status !== 'En Curso' || signature.trim().length < 3}
          onClick={() =>
            void run({
              kind: 'finish-service',
              orderId: order.id,
              clientSignature: signature.trim(),
            })
          }
        >
          Finalizar Servicio
        </Button>
        {order.serviceStartedAt && (
          <p className="text-xs text-slate-500">
            Inicio {new Date(order.serviceStartedAt).toLocaleString('es-CL')}
            {order.durationHours != null ? ` · ${order.durationHours} h` : ''}
          </p>
        )}
      </div>

      {/* CU-117: detalles técnicos */}
      <form onSubmit={submitNote} className="space-y-2 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
        <label htmlFor="field-note" className="text-sm font-semibold text-slate-900">
          Registrar avance
        </label>
        <textarea
          id="field-note"
          rows={3}
          maxLength={NOTE_MAX}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Detalles técnicos del trabajo realizado…"
          className="w-full rounded-lg border border-slate-200 p-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">La fecha y hora se registran automáticamente</span>
          <Button type="submit" size="sm" disabled={busy || !note.trim()}>
            Enviar
          </Button>
        </div>
      </form>

      {/* CU-118 */}
      <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => void takePhoto(e.target.files?.[0])}
        />
        <Button
          variant="outline"
          className="w-full"
          leftIcon={<Camera className="h-4 w-4" />}
          disabled={busy || !canPhoto}
          onClick={() => cameraRef.current?.click()}
        >
          Adjuntar foto
        </Button>
        {!canPhoto && (
          <p className="mt-2 text-xs text-slate-500">Inicia el trabajo para poder adjuntar evidencia.</p>
        )}
      </div>

      {feedback && (
        <p role="status" className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700">
          {feedback}
        </p>
      )}
    </div>
  )
}
