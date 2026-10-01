import { useCallback, useEffect, useRef, useState } from 'react'
import { Download, ImagePlus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ordersService } from '@/services/ordersService'
import { useOrdersStore } from '@/store/useOrdersStore'
import type { OrderEvidence, WorkOrder } from '@/types'

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp']
const MAX_BYTES = 5 * 1024 * 1024
/** CU-30: solo se puede adjuntar con la OT en ejecución o finalizada */
const UPLOAD_STATUSES: WorkOrder['status'][] = ['En Curso', 'Completada', 'Abonado']

function errorMessage(err: unknown, fallback: string) {
  const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
  return msg ?? fallback
}

/** Evidencia visual almacenada en el servidor — RF09 / CU-30 a CU-34 */
export function OrderEvidencePanel({
  order,
  canUpload = true,
  canManage = true,
}: {
  order: WorkOrder
  /** Operador/Administrador: adjuntar imágenes */
  canUpload?: boolean
  /** Administrador/Jefe: eliminar imágenes */
  canManage?: boolean
}) {
  const addToast = useOrdersStore((s) => s.addToast)
  const inputRef = useRef<HTMLInputElement>(null)
  const [items, setItems] = useState<OrderEvidence[]>([])
  const [thumbs, setThumbs] = useState<Record<number, string>>({})
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setItems(await ordersService.listEvidence(order.id))
      setError(null)
    } catch (err) {
      setItems([])
      setError(errorMessage(err, 'No se pudo cargar la evidencia visual'))
    } finally {
      setLoading(false)
    }
  }, [order.id])

  useEffect(() => {
    void load()
  }, [load])

  // Miniaturas: el endpoint requiere token, por eso se piden como blob
  useEffect(() => {
    let cancelled = false
    const created: string[] = []
    void (async () => {
      const next: Record<number, string> = {}
      for (const item of items) {
        try {
          const blob = await ordersService.fetchEvidenceFile(order.id, item.id)
          const url = URL.createObjectURL(blob)
          created.push(url)
          next[item.id] = url
        } catch {
          /* miniatura no disponible */
        }
      }
      if (!cancelled) setThumbs(next)
    })()
    return () => {
      cancelled = true
      created.forEach((u) => URL.revokeObjectURL(u))
    }
  }, [items, order.id])

  const statusOk = UPLOAD_STATUSES.includes(order.status)

  const handleFile = async (file?: File) => {
    if (!file) return
    if (!ACCEPTED.includes(file.type)) {
      addToast('Formato no compatible. Use JPG, PNG o WEBP', 'error')
      return
    }
    if (file.size > MAX_BYTES) {
      addToast('La imagen supera el tamaño máximo de 5 MB', 'error')
      return
    }
    setUploading(true)
    try {
      await ordersService.uploadEvidence(order.id, file)
      addToast('Carga exitosa')
      await load()
    } catch (err) {
      addToast(errorMessage(err, 'No se pudo cargar la imagen'), 'error')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const handleDownload = async (item: OrderEvidence) => {
    try {
      const blob = await ordersService.fetchEvidenceFile(order.id, item.id)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = item.fileName
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      addToast(errorMessage(err, 'No se pudo descargar la imagen'), 'error')
    }
  }

  const handleRemove = async (item: OrderEvidence) => {
    if (!window.confirm(`¿Eliminar la imagen "${item.fileName}"?`)) return
    try {
      await ordersService.removeEvidence(order.id, item.id)
      addToast('Imagen eliminada')
      await load()
    } catch (err) {
      addToast(errorMessage(err, 'No se pudo eliminar la imagen'), 'error')
    }
  }

  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-900">Evidencia visual</p>
          <p className="text-xs text-slate-500">JPG, PNG o WEBP · máx. 5 MB</p>
        </div>
        {canUpload && (
          <>
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED.join(',')}
              className="hidden"
              onChange={(e) => void handleFile(e.target.files?.[0])}
            />
            <Button
              size="sm"
              variant="outline"
              leftIcon={<ImagePlus className="h-4 w-4" />}
              disabled={!statusOk || uploading}
              title={
                statusOk ? undefined : 'La orden debe estar en ejecución o finalizada'
              }
              onClick={() => inputRef.current?.click()}
            >
              {uploading ? 'Subiendo…' : 'Adjuntar evidencia'}
            </Button>
          </>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {loading && <p className="text-sm text-slate-500">Cargando…</p>}
      {!loading && !error && items.length === 0 && (
        <p className="text-sm text-slate-500">Sin imágenes de evidencia.</p>
      )}

      {items.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="overflow-hidden rounded-lg border border-slate-100 bg-slate-50"
            >
              {thumbs[item.id] ? (
                <img
                  src={thumbs[item.id]}
                  alt={item.fileName}
                  className="h-28 w-full object-cover"
                />
              ) : (
                <div className="h-28 w-full animate-pulse bg-slate-100" />
              )}
              <div className="flex items-center justify-between gap-1 px-2 py-1">
                <span className="truncate text-[11px] text-slate-600" title={item.fileName}>
                  {item.fileName}
                </span>
                <span className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => void handleDownload(item)}
                    className="rounded p-1 text-slate-500 hover:bg-white"
                    aria-label="Descargar imagen"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </button>
                  {canManage && (
                    <button
                      type="button"
                      onClick={() => void handleRemove(item)}
                      className="rounded p-1 text-red-500 hover:bg-white"
                      aria-label="Eliminar imagen"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
