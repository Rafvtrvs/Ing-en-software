import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ImagePlus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Switch } from '@/components/ui/Switch'
import { UserAvatar } from '@/components/layout/UserAvatar'
import { AvatarCropModal } from '@/features/settings/components/AvatarCropModal'
import { useSettingsStore } from '@/store/useSettingsStore'
import { authService } from '@/services/authService'
import { applySessionUser } from '@/features/auth/sessionAvatar'
import type { AppAppearanceSettings } from '@/types'

const ACCENT_PRESETS = ['#1B8634', '#2563eb', '#0f766e', '#7c3aed', '#c2410c']
const MAX_BYTES = 5 * 1024 * 1024
const FIELD_PREFS_KEY = 'camus_field_mobile_prefs_v1'

export type FieldMobilePrefs = {
  showMap: boolean
  compactCards: boolean
}

const DEFAULT_FIELD_PREFS: FieldMobilePrefs = {
  showMap: true,
  compactCards: false,
}

export function loadFieldMobilePrefs(): FieldMobilePrefs {
  try {
    const raw = localStorage.getItem(FIELD_PREFS_KEY)
    if (!raw) return { ...DEFAULT_FIELD_PREFS }
    return { ...DEFAULT_FIELD_PREFS, ...(JSON.parse(raw) as Partial<FieldMobilePrefs>) }
  } catch {
    return { ...DEFAULT_FIELD_PREFS }
  }
}

function saveFieldMobilePrefs(prefs: FieldMobilePrefs) {
  localStorage.setItem(FIELD_PREFS_KEY, JSON.stringify(prefs))
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

type FieldMobileSettingsProps = {
  onBack: () => void
  prefs: FieldMobilePrefs
  onPrefsChange: (prefs: FieldMobilePrefs) => void
}

/** Personalización para operador en vista móvil (perfil + apariencia + terreno). */
export function FieldMobileSettings({
  onBack,
  prefs,
  onPrefsChange,
}: FieldMobileSettingsProps) {
  const profile = useSettingsStore((s) => s.config.profile)
  const appearance = useSettingsStore((s) => s.config.appearance)
  const updateAppearance = useSettingsStore((s) => s.updateAppearance)
  const resetAppearance = useSettingsStore((s) => s.resetAppearance)
  const addToast = useSettingsStore((s) => s.addToast)

  const fileRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState(profile.name)
  const [phone, setPhone] = useState(profile.phone)
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setName(profile.name)
    setPhone(profile.phone)
  }, [profile.name, profile.phone])

  const setTheme = (theme: AppAppearanceSettings['theme']) => {
    updateAppearance({ theme })
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
      setCropSrc(await readImageAsDataUrl(file))
    } catch {
      addToast('No se pudo cargar la imagen', 'error')
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const patchPrefs = (partial: Partial<FieldMobilePrefs>) => {
    const next = { ...prefs, ...partial }
    saveFieldMobilePrefs(next)
    onPrefsChange(next)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
          aria-label="Volver"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Personalización
          </h1>
          <p className="text-xs text-slate-500">Perfil, tema y vista de terreno</p>
        </div>
      </div>

      <section className="space-y-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Mi perfil</h2>
        <div className="flex items-center gap-3">
          <UserAvatar size="lg" alt={profile.name || 'Perfil'} />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,.png,.jpg,.jpeg"
              className="hidden"
              onChange={(e) => void handlePickPhoto(e.target.files?.[0] ?? null)}
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              leftIcon={<ImagePlus className="h-4 w-4" />}
              disabled={busy}
              onClick={() => fileRef.current?.click()}
            >
              Cambiar foto
            </Button>
            {profile.avatar && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                leftIcon={<Trash2 className="h-4 w-4" />}
                disabled={busy}
                onClick={() => {
                  void (async () => {
                    setBusy(true)
                    try {
                      const user = await authService.updateMe({ avatar: '' })
                      applySessionUser({
                        name: user.name,
                        role: user.role,
                        email: user.email,
                        phone: user.phone,
                        avatar: user.avatar,
                      })
                      addToast('Foto de perfil eliminada')
                    } catch {
                      addToast('No se pudo eliminar la foto', 'error')
                    } finally {
                      setBusy(false)
                    }
                  })()
                }}
              >
                Quitar foto
              </Button>
            )}
          </div>
        </div>
        <FormField label="Nombre">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </FormField>
        <FormField label="Teléfono">
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </FormField>
        <p className="text-xs text-slate-500">{profile.email}</p>
        <Button
          type="button"
          className="w-full justify-center"
          disabled={busy}
          onClick={() => {
            void (async () => {
              setBusy(true)
              try {
                const user = await authService.updateMe({
                  name: name.trim(),
                  phone: phone.trim(),
                })
                applySessionUser({
                  name: user.name,
                  role: user.role,
                  email: user.email,
                  phone: user.phone,
                  avatar: user.avatar,
                })
                addToast('Perfil actualizado')
              } catch {
                addToast('No se pudo guardar el perfil', 'error')
              } finally {
                setBusy(false)
              }
            })()
          }}
        >
          Guardar perfil
        </Button>
      </section>

      <section className="space-y-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Apariencia</h2>
        <FormField label="Tema">
          <Select
            value={appearance.theme}
            onChange={(e) =>
              setTheme(e.target.value as AppAppearanceSettings['theme'])
            }
          >
            <option value="light">Claro</option>
            <option value="dark">Oscuro</option>
            <option value="system">Sistema</option>
          </Select>
        </FormField>
        <FormField label="Color de acento">
          <div className="flex flex-wrap items-center gap-2">
            {ACCENT_PRESETS.map((c) => {
              const selected =
                appearance.accentColor?.toLowerCase() === c.toLowerCase()
              return (
                <button
                  key={c}
                  type="button"
                  title={c}
                  aria-label={`Acento ${c}`}
                  aria-pressed={selected}
                  className={
                    selected
                      ? 'h-9 w-9 rounded-full ring-2 ring-white ring-offset-2 ring-offset-primary'
                      : 'h-9 w-9 rounded-full ring-1 ring-black/10'
                  }
                  style={{ backgroundColor: c }}
                  onClick={() => updateAppearance({ accentColor: c })}
                />
              )
            })}
            <label className="relative flex h-9 w-9 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-slate-200 dark:border-slate-600">
              <input
                type="color"
                className="absolute inset-0 opacity-0"
                value={appearance.accentColor}
                onChange={(e) => updateAppearance({ accentColor: e.target.value })}
                aria-label="Color personalizado"
              />
              <span
                className="pointer-events-none h-5 w-5 rounded-full"
                style={{ backgroundColor: appearance.accentColor }}
              />
            </label>
          </div>
        </FormField>
        <FormField label="Formato de fecha">
          <Select
            value={appearance.dateFormat}
            onChange={(e) =>
              updateAppearance({
                dateFormat: e.target.value as AppAppearanceSettings['dateFormat'],
              })
            }
          >
            <option value="dd/mm/yyyy">DD/MM/AAAA</option>
            <option value="mm/dd/yyyy">MM/DD/AAAA</option>
          </Select>
        </FormField>
        <Button
          type="button"
          variant="outline"
          className="w-full justify-center"
          onClick={() => {
            resetAppearance()
            addToast('Apariencia restablecida')
          }}
        >
          Restablecer apariencia
        </Button>
      </section>

      <section className="space-y-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Vista de terreno
        </h2>
        <Switch
          id="fieldShowMap"
          label="Mostrar mapa de trabajo"
          description="Mapa con tus órdenes asignadas."
          checked={prefs.showMap}
          onChange={(v) => patchPrefs({ showMap: v })}
        />
        <Switch
          id="fieldCompactCards"
          label="Tarjetas compactas"
          description="Menos detalle en la lista de órdenes."
          checked={prefs.compactCards}
          onChange={(v) => patchPrefs({ compactCards: v })}
        />
      </section>

      <AvatarCropModal
        open={Boolean(cropSrc)}
        imageSrc={cropSrc}
        onClose={() => setCropSrc(null)}
        onConfirm={(url) => {
          void (async () => {
            setBusy(true)
            try {
              const user = await authService.updateMe({ avatar: url })
              applySessionUser({
                name: user.name,
                role: user.role,
                email: user.email,
                phone: user.phone,
                avatar: user.avatar,
              })
              setCropSrc(null)
              addToast('Foto de perfil actualizada')
            } catch {
              addToast('No se pudo guardar la foto', 'error')
            } finally {
              setBusy(false)
            }
          })()
        }}
      />
    </div>
  )
}
