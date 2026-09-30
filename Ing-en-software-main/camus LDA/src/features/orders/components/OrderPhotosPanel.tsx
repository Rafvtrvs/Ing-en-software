import { useState, type FormEvent } from 'react'
import { Camera, Pencil, Trash2 } from 'lucide-react'
import { OrderPhotoAnnotationModal } from '@/features/orders/components/OrderPhotoAnnotationModal'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { useOrdersStore } from '@/store/useOrdersStore'
import type { WorkOrder } from '@/types'

const SAMPLE_PHOTO = 'https://picsum.photos/seed/camus-evidencia/640/480'

export function OrderPhotosPanel({
  order,
  canEdit = true,
}: {
  order: WorkOrder
  canEdit?: boolean
}) {
  const addPhotoUrl = useOrdersStore((s) => s.addPhotoUrl)
  const removePhotoUrl = useOrdersStore((s) => s.removePhotoUrl)
  const getPhotoAnnotation = useOrdersStore((s) => s.getPhotoAnnotation)
  const [url, setUrl] = useState('')
  const [annotatePhoto, setAnnotatePhoto] = useState<string | null>(null)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!canEdit || !url.trim()) return
    addPhotoUrl(order.id, url.trim())
    setUrl('')
  }

  const photos = order.photoUrls ?? []

  return (
    <div id="evidencia-fotografica" className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <Camera className="h-4 w-4 text-slate-400" />
        <div>
          <p className="text-sm font-semibold text-slate-900">Evidencia fotográfica y anotación</p>
          <p className="text-xs text-slate-500">
            Agregue una URL de imagen y use <strong>Anotar imagen</strong> para dibujar sobre la foto.
          </p>
        </div>
      </div>

      {photos.length > 0 && (
        <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {photos.map((photo) => {
            const hasAnnotation = Boolean(getPhotoAnnotation(order.id, photo)?.strokes.length)
            return (
              <div
                key={photo}
                className="overflow-hidden rounded-lg border border-slate-100 bg-slate-50"
              >
                <img
                  src={photo}
                  alt="Evidencia"
                  className="h-36 w-full object-cover"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
                <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 px-2 py-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    leftIcon={<Pencil className="h-3.5 w-3.5" />}
                    onClick={() => setAnnotatePhoto(photo)}
                  >
                    Anotar imagen
                  </Button>
                  {hasAnnotation && (
                    <span className="text-xs font-medium text-emerald-600">Con anotación guardada</span>
                  )}
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => removePhotoUrl(order.id, photo)}
                      className="ml-auto rounded p-1.5 text-red-500 hover:bg-red-50"
                      aria-label="Quitar foto"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {canEdit && (
        <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2">
          <FormField label="URL de foto" htmlFor={`photo-${order.id}`} className="min-w-[200px] flex-1">
            <Input
              id={`photo-${order.id}`}
              placeholder={SAMPLE_PHOTO}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </FormField>
          <Button type="submit">Agregar foto</Button>
        </form>
      )}

      {photos.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">
          <p>Sin fotos en esta OT.</p>
          {canEdit && (
            <p className="mt-2 text-xs">
              Pegue una URL y pulse <strong>Agregar foto</strong>, luego <strong>Anotar imagen</strong>.
            </p>
          )}
        </div>
      )}

      {annotatePhoto && (
        <OrderPhotoAnnotationModal
          orderId={order.id}
          photoUrl={annotatePhoto}
          open={Boolean(annotatePhoto)}
          onClose={() => setAnnotatePhoto(null)}
        />
      )}
    </div>
  )
}
