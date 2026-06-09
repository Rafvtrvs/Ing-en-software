import { useEffect, useState, type FormEvent } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Switch } from '@/components/ui/Switch'
import { useSettingsStore } from '@/store/useSettingsStore'
import type { SecuritySettings } from '@/types'
import { SettingsCard } from './SettingsCard'

export function SecuritySettingsPanel() {
  const security = useSettingsStore((s) => s.config.security)
  const updateSecurity = useSettingsStore((s) => s.updateSecurity)
  const addToast = useSettingsStore((s) => s.addToast)
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' })

  const { register, handleSubmit, reset, watch, setValue } = useForm<SecuritySettings>({
    defaultValues: security,
  })

  useEffect(() => {
    reset(security)
  }, [security, reset])

  const onSubmit = (data: SecuritySettings) => {
    updateSecurity({
      ...data,
      sessionTimeoutMinutes: Number(data.sessionTimeoutMinutes),
    })
    addToast('Configuración de seguridad guardada')
  }

  const handlePasswordChange = (e: FormEvent) => {
    e.preventDefault()
    if (!passwords.current || !passwords.next) {
      addToast('Completa todos los campos de contraseña', 'error')
      return
    }
    if (passwords.next !== passwords.confirm) {
      addToast('Las contraseñas no coinciden', 'error')
      return
    }
    if (passwords.next.length < 8) {
      addToast('La contraseña debe tener al menos 8 caracteres', 'error')
      return
    }
    addToast('Contraseña actualizada correctamente')
    setPasswords({ current: '', next: '', confirm: '' })
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)}>
        <SettingsCard
          title="Seguridad de la cuenta"
          subtitle="Sesión, alertas y autenticación."
          footer={<Button type="submit">Guardar seguridad</Button>}
        >
          <FormField label="Tiempo de sesión (minutos)">
            <Input
              type="number"
              min={15}
              {...register('sessionTimeoutMinutes', { valueAsNumber: true })}
            />
          </FormField>
          <div className="space-y-4 rounded-xl border border-slate-100 bg-slate-50/50 p-4">
            <Switch
              id="2fa"
              label="Autenticación de dos factores (2FA)"
              description="Capa adicional de seguridad al iniciar sesión."
              checked={watch('twoFactorEnabled')}
              onChange={(v) => setValue('twoFactorEnabled', v)}
            />
            <Switch
              id="loginAlerts"
              label="Alertas de inicio de sesión"
              description="Recibe email cuando hay acceso desde un dispositivo nuevo."
              checked={watch('loginAlerts')}
              onChange={(v) => setValue('loginAlerts', v)}
            />
          </div>
        </SettingsCard>
      </form>

      <form onSubmit={handlePasswordChange}>
        <SettingsCard
          title="Cambiar contraseña"
          subtitle="Usa una contraseña segura de al menos 8 caracteres."
          footer={<Button type="submit">Actualizar contraseña</Button>}
        >
          <FormField label="Contraseña actual">
            <Input
              type="password"
              value={passwords.current}
              onChange={(e) => setPasswords((p) => ({ ...p, current: e.target.value }))}
            />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Nueva contraseña">
              <Input
                type="password"
                value={passwords.next}
                onChange={(e) => setPasswords((p) => ({ ...p, next: e.target.value }))}
              />
            </FormField>
            <FormField label="Confirmar contraseña">
              <Input
                type="password"
                value={passwords.confirm}
                onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))}
              />
            </FormField>
          </div>
        </SettingsCard>
      </form>
    </div>
  )
}
