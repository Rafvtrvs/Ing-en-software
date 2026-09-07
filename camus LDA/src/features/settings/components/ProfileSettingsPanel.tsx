import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { useSettingsStore } from '@/store/useSettingsStore'
import type { UserProfileSettings } from '@/types'
import { SettingsCard } from './SettingsCard'

export function ProfileSettingsPanel() {
  const profile = useSettingsStore((s) => s.config.profile)
  const updateProfile = useSettingsStore((s) => s.updateProfile)
  const addToast = useSettingsStore((s) => s.addToast)

  const { register, handleSubmit, reset } = useForm<UserProfileSettings>({
    defaultValues: profile,
  })

  useEffect(() => {
    reset(profile)
  }, [profile, reset])

  const onSubmit = (data: UserProfileSettings) => {
    updateProfile({
      ...data,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(data.name)}`,
    })
    addToast('Perfil actualizado correctamente')
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <SettingsCard
        title="Mi Perfil"
        subtitle="Datos visibles en el encabezado y comunicaciones."
        footer={<Button type="submit">Guardar perfil</Button>}
      >
        <div className="mb-4 flex items-center gap-4">
          <img
            src={profile.avatar}
            alt=""
            className="h-16 w-16 rounded-full bg-slate-100 object-cover"
          />
          <p className="text-sm text-slate-500">
            El avatar se genera automáticamente según tu nombre.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Nombre completo" required>
            <Input {...register('name', { required: true })} />
          </FormField>
          <FormField label="Teléfono">
            <Input {...register('phone')} />
          </FormField>
        </div>
        <FormField label="Email">
          <Input type="email" {...register('email')} />
        </FormField>
      </SettingsCard>
    </form>
  )
}
