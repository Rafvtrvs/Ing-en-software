import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { Camera, ImagePlus, Pencil, Trash2 } from 'lucide-react'
import { OrderPhotoAnnotationModal } from '@/features/orders/components/OrderPhotoAnnotationModal'
import { AvatarCropModal } from '@/features/settings/components/AvatarCropModal'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { useOrdersStore } from '@/store/useOrdersStore'
import { ordersService } from '@/services/ordersService'
import type { OrderEvidence, WorkOrder } from '@/types'

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
  const addToast = useOrdersStore((s) => s.addToast)
  const fileRef = useRef<HTMLInputElement>(null)
  const [url, setUrl] = useState('')
  const [items, setItems] = useState<OrderEvidence[]>([])
  const [thumbs, setThumbs] = useState<Record<number, string>>({})
  const [annotatePhoto, setAnnotatePhoto] = useState<string | null>(null)
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    try {
      setItems(await ordersService.listEvidence(order.id))
    } catch {
      setItems([])
    }
  }, [order.id])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    let cancelled = false
    const created: string[] = []
    void (async () => {
      const next: Record<number, string> = {}
      for (const item of items) {
        if (item.externalUrl) {
          next[item.id] = item.externalUrl
          continue
        }
        try {
          const blob = await ordersService.fetchEvidenceFile(order.id, item.id)
          const objectUrl = URL.createObjectURL(blob)
          created.push(objectUrl)
          next[item.id] = objectUrl
        } catch {
          /* archivo no disponible */
        }
      }
      if (!cancelled) setThumbs(next)
    })()
    return () => {
      cancelled = true
      created.forEach((objectUrl) => URL.revokeObjectURL(objectUrl))
    }
  }, [items, order.id])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const href = url.trim()
    if (!canEdit || !href) return
    setBusy(true)
    try {
      await ordersService.linkEvidenceUrl(order.id, href)
      setUrl('')
      await load()
      addToast('Evidencia fotográfica agregada')
    } catch (err) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'No se pudo guardar la URL'
      addToast(message, 'error')
    } finally {
      setBusy(false)
    }
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

  const photos = items.flatMap((item) => {
    const src = thumbs[item.id]
    return src ? [{ item, src }] : []
  })

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
          {photos.map(({ item, src }) => (
            <div
              key={item.id}
              className="group relative overflow-hidden rounded-lg border border-slate-100 bg-slate-50"
            >
              <img
                src={src}
                alt={item.fileName}
                className="h-28 w-full object-cover"
              />
              <p className="truncate px-2 py-1 text-[11px] text-slate-500">
                {item.externalUrl ? 'Enlace' : item.fileName}
              </p>
              {canEdit && (
                <div className="absolute right-1 top-1 flex gap-1 opacity-0 group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => setAnnotatePhoto(src)}
                    className="rounded bg-white/90 p-1 text-primary shadow"
                    aria-label="Realizar anotación en imagen"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void ordersService
                        .removeEvidence(order.id, item.id)
                        .then(() => load())
                        .catch(() => addToast('No se pudo quitar la foto', 'error'))
                    }}
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
          setCropSrc(null)
          setBusy(true)
          void (async () => {
            try {
              const response = await fetch(dataUrl)
              const blob = await response.blob()
              const file = new File([blob], 'evidencia.jpg', {
                type: blob.type || 'image/jpeg',
              })
              await ordersService.uploadEvidence(order.id, file)
              await load()
              addToast('Evidencia fotográfica agregada')
            } catch (err) {
              const message =
                (err as { response?: { data?: { error?: string } } })?.response?.data
                  ?.error ?? 'No se pudo guardar la imagen'
              addToast(message, 'error')
            } finally {
              setBusy(false)
            }
          })()
        }}
      />
    </div>
  )
}
