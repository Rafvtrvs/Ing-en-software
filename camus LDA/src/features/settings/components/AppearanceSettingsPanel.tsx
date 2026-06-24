import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { Select } from '@/components/ui/Select'
import { Switch } from '@/components/ui/Switch'
import { useSettingsStore } from '@/store/useSettingsStore'
import type { AppAppearanceSettings } from '@/types'
import { SettingsCard } from './SettingsCard'

export function AppearanceSettingsPanel() {
  const appearance = useSettingsStore((s) => s.config.appearance)
  const updateAppearance = useSettingsStore((s) => s.updateAppearance)
  const addToast = useSettingsStore((s) => s.addToast)

  const { register, handleSubmit, reset, watch, setValue } = useForm<AppAppearanceSettings>({
    defaultValues: appearance,
  })

  useEffect(() => {
    reset(appearance)
  }, [appearance, reset])

  const onSubmit = (data: AppAppearanceSettings) => {
    updateAppearance(data)
    addToast('Preferencias de apariencia guardadas')
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <SettingsCard
        title="Apariencia"
        subtitle="Tema, idioma y formato de la interfaz."
        footer={<Button type="submit">Guardar apariencia</Button>}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Tema">
            <Select {...register('theme')}>
              <option value="light">Claro</option>
              <option value="dark">Oscuro</option>
              <option value="system">Sistema</option>
            </Select>
          </FormField>
          <FormField label="Idioma">
            <Select {...register('language')}>
              <option value="es">Español</option>
              <option value="en">English</option>
            </Select>
          </FormField>
        </div>
        <FormField label="Formato de fecha">
          <Select {...register('dateFormat')}>
            <option value="dd/mm/yyyy">DD/MM/AAAA</option>
            <option value="mm/dd/yyyy">MM/DD/AAAA</option>
          </Select>
        </FormField>
        <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
          <Switch
            id="compactSidebar"
            label="Barra lateral compacta"
            description="Inicia con el menú lateral colapsado."
            checked={watch('compactSidebar')}
            onChange={(v) => setValue('compactSidebar', v)}
          />
        </div>

        <div className="rounded-xl border border-slate-200 p-4">
          <p className="mb-3 text-sm font-medium text-slate-700">Vista previa del tema</p>
          <div
            className={
              watch('theme') === 'dark'
                ? 'rounded-lg bg-slate-900 p-4 text-slate-100'
                : 'rounded-lg bg-white p-4 text-slate-900 shadow-sm ring-1 ring-slate-200'
            }
          >
            <p className="text-sm font-semibold">Alcantarillados Camus Ltda.</p>
            <p className="mt-1 text-xs opacity-70">
              Panel de control — {watch('language') === 'en' ? 'Dashboard' : 'Tablero'}
            </p>
            <div className="mt-3 flex gap-2">
              <span className="rounded-md bg-blue-600 px-2 py-1 text-xs text-white">Acción</span>
              <span className="rounded-md border px-2 py-1 text-xs">Secundario</span>
            </div>
          </div>
        </div>
      </SettingsCard>
    </form>
  )
}
