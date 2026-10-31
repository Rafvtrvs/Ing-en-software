import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { ImagePlus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { FormGrid } from '@/components/ui/FormGrid'
import { Input } from '@/components/ui/Input'
import { useSettingsStore } from '@/store/useSettingsStore'
import type { UserProfileSettings } from '@/types'
import { UserAvatar } from '@/components/layout/UserAvatar'
import { SettingsCard } from './SettingsCard'
import { AvatarCropModal } from './AvatarCropModal'

const MAX_BYTES = 5 * 1024 * 1024 // RNF-08

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

export function ProfileSettingsPanel() {
  const profile = useSettingsStore((s) => s.config.profile)
  const updateProfile = useSettingsStore((s) => s.updateProfile)
  const addToast = useSettingsStore((s) => s.addToast)
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [cropSrc, setCropSrc] = useState<string | null>(null)

  const { register, handleSubmit, reset, watch, setValue } =
    useForm<UserProfileSettings>({
      defaultValues: profile,
    })

  const avatar = watch('avatar')

  useEffect(() => {
    reset(profile)
  }, [profile, reset])

  const onSubmit = (data: UserProfileSettings) => {
    updateProfile(data)
    addToast('Perfil actualizado correctamente')
  }

  const handlePickPhoto = async (file: File | null) => {
    if (!file) return
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
      const dataUrl = await readImageAsDataUrl(file)
      setCropSrc(dataUrl)
    } catch {
      addToast('No se pudo cargar la imagen', 'error')
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const handleCropConfirm = (croppedDataUrl: string) => {
    setValue('avatar', croppedDataUrl, { shouldDirty: true })
    updateProfile({ avatar: croppedDataUrl })
    setCropSrc(null)
    addToast('Foto de perfil actualizada')
  }

  const handleRemovePhoto = () => {
    setValue('avatar', '', { shouldDirty: true })
    updateProfile({ avatar: '' })
    addToast('Foto de perfil eliminada')
  }

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        <SettingsCard
          title="Mi Perfil"
          subtitle="Datos visibles en el encabezado y comunicaciones."
          footer={<Button type="submit">Guardar perfil</Button>}
        >
          <div className="mb-4 flex flex-wrap items-center gap-4">
            <UserAvatar size="lg" src={avatar || null} />
            <div className="space-y-2">
              <p className="text-sm text-slate-500">
                Subí un PNG o JPG y ajustá el recorte (máx. 5 MB).
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  leftIcon={<ImagePlus className="h-4 w-4" />}
                  disabled={busy}
                  onClick={() => fileRef.current?.click()}
                >
                  {busy ? 'Cargando…' : 'Subir foto'}
                </Button>
                {avatar ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    leftIcon={<Trash2 className="h-4 w-4" />}
                    onClick={handleRemovePhoto}
                  >
                    Quitar foto
                  </Button>
                ) : null}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,.png,.jpg,.jpeg"
                className="hidden"
                onChange={(e) => void handlePickPhoto(e.target.files?.[0] ?? null)}
              />
            </div>
          </div>
          <FormGrid cols={2}>
            <FormField label="Nombre completo" required>
              <Input {...register('name', { required: true })} />
            </FormField>
            <FormField label="Teléfono">
              <Input {...register('phone')} />
            </FormField>
          </FormGrid>
          <FormField label="Email">
            <Input type="email" {...register('email')} />
          </FormField>
        </SettingsCard>
      </form>

      <AvatarCropModal
        open={Boolean(cropSrc)}
        imageSrc={cropSrc}
        onClose={() => setCropSrc(null)}
        onConfirm={handleCropConfirm}
      />
    </>
  )
}
