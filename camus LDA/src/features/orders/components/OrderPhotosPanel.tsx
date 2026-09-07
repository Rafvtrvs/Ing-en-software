import { useState, type FormEvent } from 'react'
import { Camera, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { useOrdersStore } from '@/store/useOrdersStore'
import type { WorkOrder } from '@/types'

/** Evidencia fotográfica por URL (OT + terceros) */
export function OrderPhotosPanel({
  order,
  canEdit = true,
}: {
  order: WorkOrder
  canEdit?: boolean
}) {
  const addPhotoUrl = useOrdersStore((s) => s.addPhotoUrl)
  const removePhotoUrl = useOrdersStore((s) => s.removePhotoUrl)
  const [url, setUrl] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!canEdit || !url.trim()) return
    addPhotoUrl(order.id, url.trim())
    setUrl('')
  }

  const photos = order.photoUrls ?? []

  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <Camera className="h-4 w-4 text-slate-400" />
        <div>
          <p className="text-sm font-semibold text-slate-900">
            Evidencia fotográfica
          </p>
          <p className="text-xs text-slate-500">
            Registra fotos mediante URL (sin carga de archivos)
          </p>
        </div>
      </div>

      {photos.length > 0 && (
        <div className="mb-3 grid grid-cols-2 gap-2">
          {photos.map((photo) => (
            <div
              key={photo}
              className="group relative overflow-hidden rounded-lg border border-slate-100 bg-slate-50"
            >
              <img
                src={photo}
                alt="Evidencia"
                className="h-28 w-full object-cover"
                onError={(e) => {
                  ;(e.target as HTMLImageElement).style.display = 'none'
                }}
              />
              <a
                href={photo}
                target="_blank"
                rel="noreferrer"
                className="block truncate px-2 py-1 text-[11px] text-primary hover:underline"
              >
                {photo}
              </a>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => removePhotoUrl(order.id, photo)}
                  className="absolute right-1 top-1 rounded bg-white/90 p-1 text-red-500 opacity-0 shadow group-hover:opacity-100"
                  aria-label="Quitar foto"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {canEdit && (
        <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2">
          <FormField label="URL de foto" htmlFor={`photo-${order.id}`} className="min-w-[200px] flex-1">
            <Input
              id={`photo-${order.id}`}
              placeholder="https://…"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </FormField>
          <Button type="submit">Agregar</Button>
        </form>
      )}

      {photos.length === 0 && (
        <p className="text-sm text-slate-500">Sin evidencias fotográficas.</p>
      )}
    </div>
  )
}
