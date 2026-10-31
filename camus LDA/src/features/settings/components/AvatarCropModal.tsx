import { useCallback, useState } from 'react'
import Cropper, { type Area } from 'react-easy-crop'
import 'react-easy-crop/react-easy-crop.css'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'

type AvatarCropModalProps = {
  open: boolean
  imageSrc: string | null
  onClose: () => void
  onConfirm: (croppedDataUrl: string) => void
  title?: string
  description?: string
  /** round = perfil; rect = evidencia */
  cropShape?: 'round' | 'rect'
  aspect?: number
  outputSize?: number
}

async function getCroppedPng(
  imageSrc: string,
  pixelCrop: Area,
  outputSize = 256,
): Promise<string> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.addEventListener('load', () => resolve(img))
    img.addEventListener('error', () => reject(new Error('No se pudo cargar la imagen')))
    img.src = imageSrc
  })

  const canvas = document.createElement('canvas')
  const scale = outputSize / Math.max(pixelCrop.width, pixelCrop.height)
  canvas.width = Math.round(pixelCrop.width * scale)
  canvas.height = Math.round(pixelCrop.height * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas no disponible')

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    canvas.width,
    canvas.height,
  )

  return canvas.toDataURL('image/png')
}

export function AvatarCropModal({
  open,
  imageSrc,
  onClose,
  onConfirm,
  title = 'Recortar foto de perfil',
  description = 'Arrastrá la imagen y usá el zoom para ajustar el encuadre.',
  cropShape = 'round',
  aspect = 1,
  outputSize = 256,
}: AvatarCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [busy, setBusy] = useState(false)

  const onCropComplete = useCallback((_area: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels)
  }, [])

  const handleConfirm = async () => {
    if (!imageSrc || !croppedAreaPixels) return
    setBusy(true)
    try {
      const dataUrl = await getCroppedPng(imageSrc, croppedAreaPixels, outputSize)
      onConfirm(dataUrl)
      onClose()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancelar
          </Button>
          <Button onClick={() => void handleConfirm()} disabled={busy || !croppedAreaPixels}>
            {busy ? 'Aplicando…' : 'Usar foto'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="relative h-72 w-full overflow-hidden rounded-xl bg-slate-900">
          {imageSrc && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              cropShape={cropShape}
              showGrid={cropShape === 'rect'}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          )}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="image-zoom">
            Zoom
          </label>
          <input
            id="image-zoom"
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full accent-primary"
          />
        </div>
      </div>
    </Modal>
  )
}
