import { useRef, useState, type FormEvent } from 'react'
import { Camera, ImagePlus, Pencil, Trash2 } from 'lucide-react'
import { OrderPhotoAnnotationModal } from '@/features/orders/components/OrderPhotoAnnotationModal'
import { AvatarCropModal } from '@/features/settings/components/AvatarCropModal'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { useOrdersStore } from '@/store/useOrdersStore'
import type { WorkOrder } from '@/types'

const MAX_BYTES = 5 * 1024 * 1024

function isAllowedImage(file: File): boolean {
  const type = file.type.toLowerCase()
  const name = file.name.toLowerCase()
  return (
    type === 'image/png' ||
    type === 'image/jpeg' ||
    type === 'image/jpg' ||
    name.endsWith('.png') ||
    name.endsWith('.jpg') ||
    name.endsWith('.jpeg')
  )
}

function readImageAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result)
      else reject(new Error('No se pudo leer la imagen'))
    }
    reader.onerror = () => reject(new Error('Error al leer el archivo'))
    reader.readAsDataURL(file)
  })
}

/** Evidencia fotográfica: URL o archivo local PNG/JPG con recorte */
export function OrderPhotosPanel({
  order,
  canEdit = true,
}: {
  order: WorkOrder
  canEdit?: boolean
}) {
  const addPhotoUrl = useOrdersStore((s) => s.addPhotoUrl)
  const removePhotoUrl = useOrdersStore((s) => s.removePhotoUrl)
  const addToast = useOrdersStore((s) => s.addToast)
  const fileRef = useRef<HTMLInputElement>(null)
  const [url, setUrl] = useState('')
  const [annotatePhoto, setAnnotatePhoto] = useState<string | null>(null)
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!canEdit || !url.trim()) return
    addPhotoUrl(order.id, url.trim())
    setUrl('')
  }

  const handlePickFile = async (file: File | null) => {
    if (!file || !canEdit) return
    if (!isAllowedImage(file)) {
      addToast('Solo se permiten imágenes PNG o JPG', 'error')
      return
    }
    if (file.size > MAX_BYTES) {
      addToast('La imagen no puede superar 5 MB', 'error')
      return
    }
    setBusy(true)
    try {
      setCropSrc(await readImageAsDataUrl(file))
    } catch {
      addToast('No se pudo cargar la imagen', 'error')
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const photos = order.photoUrls ?? []

  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Camera className="h-4 w-4 text-slate-400" />
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Evidencia fotográfica
            </p>
            <p className="text-xs text-slate-500">
              Subí PNG/JPG desde tu PC o pegá una URL (máx. 5 MB)
            </p>
          </div>
        </div>
        {canEdit && (
          <>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,.png,.jpg,.jpeg"
              className="hidden"
              onChange={(e) => void handlePickFile(e.target.files?.[0] ?? null)}
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              leftIcon={<ImagePlus className="h-4 w-4" />}
              disabled={busy}
              onClick={() => fileRef.current?.click()}
            >
              {busy ? 'Cargando…' : 'Subir PNG/JPG'}
            </Button>
          </>
        )}
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
              {!photo.startsWith('data:') && (
                <a
                  href={photo}
                  target="_blank"
                  rel="noreferrer"
                  className="block truncate px-2 py-1 text-[11px] text-primary hover:underline"
                >
                  {photo}
                </a>
              )}
              {photo.startsWith('data:') && (
                <p className="truncate px-2 py-1 text-[11px] text-slate-500">
                  Imagen local
                </p>
              )}
              {canEdit && (
                <div className="absolute right-1 top-1 flex gap-1 opacity-0 group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => setAnnotatePhoto(photo)}
                    className="rounded bg-white/90 p-1 text-primary shadow"
                    aria-label="Realizar anotación en imagen"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removePhotoUrl(order.id, photo)}
                    className="rounded bg-white/90 p-1 text-red-500 shadow"
                    aria-label="Quitar foto"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {canEdit && (
        <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2">
          <FormField
            label="URL de foto (opcional)"
            htmlFor={`photo-${order.id}`}
            className="min-w-[200px] flex-1"
          >
            <Input
              id={`photo-${order.id}`}
              placeholder="https://…"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </FormField>
          <Button type="submit">Agregar URL</Button>
        </form>
      )}

      {photos.length === 0 && (
        <p className="mt-2 text-sm text-slate-500">Sin evidencias fotográficas.</p>
      )}

      {annotatePhoto && (
        <OrderPhotoAnnotationModal
          orderId={order.id}
          photoUrl={annotatePhoto}
          open={Boolean(annotatePhoto)}
          onClose={() => setAnnotatePhoto(null)}
        />
      )}

      <AvatarCropModal
        open={Boolean(cropSrc)}
        imageSrc={cropSrc}
        onClose={() => setCropSrc(null)}
        title="Recortar evidencia"
        description="Ajustá el encuadre antes de registrar la evidencia en la OT."
        cropShape="rect"
        aspect={4 / 3}
        outputSize={960}
        onConfirm={(dataUrl) => {
          addPhotoUrl(order.id, dataUrl)
          setCropSrc(null)
        }}
      />
    </div>
  )
}
