import { useCallback, useEffect, useRef, useState } from 'react'
import { Eraser, Pencil, RotateCcw, Save } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useOrdersStore } from '@/store/useOrdersStore'
import type { PhotoDrawingStroke } from '@/types'

interface OrderPhotoAnnotationModalProps {
  orderId: string
  photoUrl: string
  open: boolean
  onClose: () => void
}

/** RF55 — CU-193 a CU-196 */
export function OrderPhotoAnnotationModal({
  orderId,
  photoUrl,
  open,
  onClose,
}: OrderPhotoAnnotationModalProps) {
  const getAnnotation = useOrdersStore((s) => s.getPhotoAnnotation)
  const savePhotoAnnotation = useOrdersStore((s) => s.savePhotoAnnotation)
  const addToast = useOrdersStore((s) => s.addToast)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const drawingRef = useRef(false)
  const [editMode, setEditMode] = useState(false)
  const [strokes, setStrokes] = useState<PhotoDrawingStroke[]>([])
  const [currentStroke, setCurrentStroke] = useState<PhotoDrawingStroke | null>(null)

  useEffect(() => {
    if (!open) return
    const existing = getAnnotation(orderId, photoUrl)
    setStrokes(existing?.strokes ?? [])
    setEditMode(false)
    setCurrentStroke(null)
  }, [open, orderId, photoUrl, getAnnotation])

  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    const img = imgRef.current
    if (!canvas || !img || !img.complete) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    canvas.width = img.clientWidth
    canvas.height = img.clientHeight
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    const all = currentStroke ? [...strokes, currentStroke] : strokes
    for (const stroke of all) {
      if (stroke.points.length < 2) continue
      ctx.strokeStyle = stroke.color
      ctx.lineWidth = stroke.width
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.beginPath()
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y)
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y)
      }
      ctx.stroke()
    }
  }, [strokes, currentStroke])

  useEffect(() => {
    redraw()
  }, [redraw, editMode, open])

  const pointerPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    }
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!editMode) return
    drawingRef.current = true
    const p = pointerPos(e)
    setCurrentStroke({ points: [p], color: '#dc2626', width: 3 })
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current || !editMode || !currentStroke) return
    const p = pointerPos(e)
    setCurrentStroke({ ...currentStroke, points: [...currentStroke.points, p] })
  }

  const handlePointerUp = () => {
    if (!drawingRef.current || !currentStroke) return
    drawingRef.current = false
    setStrokes((prev) => [...prev, currentStroke])
    setCurrentStroke(null)
  }

  const handleUndo = () => {
    setStrokes((prev) => prev.slice(0, -1))
    addToast('Último trazo eliminado', 'info')
  }

  const handleClear = () => {
    setStrokes([])
    addToast('Trazos borrados del lienzo', 'info')
  }

  const handleSave = () => {
    savePhotoAnnotation(orderId, photoUrl, strokes)
    addToast('Imagen guardada con metadatos de dibujo. El archivo original no fue alterado.')
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Anotación sobre evidencia"
      description="Dibuje sobre la imagen sin modificar el archivo original. Guarde cuando termine."
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          <Button leftIcon={<Save className="h-4 w-4" />} onClick={handleSave} disabled={!editMode}>
            Guardar anotación
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {!editMode ? (
          <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
            Presione <strong>Realizar anotación</strong> para habilitar las herramientas de dibujo sobre la
            imagen (sin modificar el archivo original).
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" leftIcon={<RotateCcw className="h-4 w-4" />} onClick={handleUndo}>
              Deshacer trazo
            </Button>
            <Button variant="outline" size="sm" leftIcon={<Eraser className="h-4 w-4" />} onClick={handleClear}>
              Limpiar trazos
            </Button>
          </div>
        )}

        <div className="relative mx-auto max-w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
          <img
            ref={imgRef}
            src={photoUrl}
            alt="Evidencia a anotar"
            className="max-h-[360px] w-full object-contain"
            onLoad={redraw}
          />
          <canvas
            ref={canvasRef}
            className={`absolute inset-0 h-full w-full ${editMode ? 'cursor-crosshair touch-none' : 'pointer-events-none'}`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          />
        </div>

        {!editMode && (
          <Button leftIcon={<Pencil className="h-4 w-4" />} onClick={() => setEditMode(true)}>
            Realizar anotación
          </Button>
        )}
      </div>
    </Modal>
  )
}
