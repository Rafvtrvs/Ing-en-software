import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { FormGrid } from '@/components/ui/FormGrid'
import { Select } from '@/components/ui/Select'
import { Switch } from '@/components/ui/Switch'
import { useSettingsStore } from '@/store/useSettingsStore'
import type { AppAppearanceSettings } from '@/types'
import { SettingsCard } from './SettingsCard'

const ACCENT_PRESETS = ['#2563eb', '#0f766e', '#7c3aed', '#c2410c', '#be123c']

/** RF-37 CU-125..129 — tema, colores, tablas, gráficos y reset */
export function AppearanceSettingsPanel() {
  const appearance = useSettingsStore((s) => s.config.appearance)
  const updateAppearance = useSettingsStore((s) => s.updateAppearance)
  const resetAppearance = useSettingsStore((s) => s.resetAppearance)
  const resetAppearanceSection = useSettingsStore((s) => s.resetAppearanceSection)
  const factoryResetUi = useSettingsStore((s) => s.factoryResetUi)
  const resetDashboardLayout = useSettingsStore((s) => s.resetDashboardLayout)
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <SettingsCard
        title="Apariencia"
        subtitle="Tema, idioma y formato de la interfaz (CU-125)."
        footer={<Button type="submit">Guardar apariencia</Button>}
      >
        <FormGrid cols={2}>
          <FormField label="Tema">
            <Select
              {...register('theme', {
                onChange: (e) => {
                  updateAppearance({
                    theme: e.target.value as AppAppearanceSettings['theme'],
                  })
                },
              })}
            >
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
        </FormGrid>
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

        <FormField label="Color de acento (menú y paneles)" htmlFor="accentColor">
          <div className="flex flex-wrap items-center gap-3">
            <label
              htmlFor="accentColor"
              className="relative flex h-11 w-14 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-600 dark:bg-slate-900"
              title="Elegir color"
            >
              <input
                id="accentColor"
                type="color"
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                value={watch('accentColor')}
                onChange={(e) => {
                  const value = e.target.value
                  setValue('accentColor', value, { shouldDirty: true })
                  updateAppearance({ accentColor: value })
                }}
              />
              <span
                className="pointer-events-none h-7 w-9 rounded-md border border-black/10"
                style={{ backgroundColor: watch('accentColor') }}
              />
            </label>
            <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
              {watch('accentColor')}
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {ACCENT_PRESETS.map((c) => {
                const selected =
                  watch('accentColor')?.toLowerCase() === c.toLowerCase()
                return (
                  <button
                    key={c}
                    type="button"
                    title={c}
                    aria-label={`Acento ${c}`}
                    aria-pressed={selected}
                    className={
                      selected
                        ? 'h-9 w-9 rounded-full ring-2 ring-primary ring-offset-2 ring-offset-white dark:ring-offset-slate-800'
                        : 'h-9 w-9 rounded-full ring-1 ring-black/10 ring-offset-1 ring-offset-white hover:ring-2 hover:ring-slate-400 dark:ring-white/20 dark:ring-offset-slate-800'
                    }
                    style={{ backgroundColor: c }}
                    onClick={() => {
                      setValue('accentColor', c, { shouldDirty: true })
                      updateAppearance({ accentColor: c })
                    }}
                  />
                )
              })}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => resetAppearanceSection('colors')}
            >
              Restaurar color
            </Button>
          </div>
        </FormField>

        <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-700">
          <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
            Tablas de datos (CU-127)
          </p>
          <p className="text-xs text-slate-500">
            Se aplican al instante en Usuarios, Órdenes, Inventario y Reportes.
          </p>
          <Switch
            id="zebraTables"
            label="Filas alternas"
            description="Mejora la lectura de tablas densas."
            checked={watch('zebraTables')}
            onChange={(v) => {
              setValue('zebraTables', v)
              updateAppearance({ zebraTables: v })
            }}
          />
          <Switch
            id="highContrastTables"
            label="Alto contraste"
            description="Encabezados y bordes más marcados."
            checked={watch('highContrastTables')}
            onChange={(v) => {
              setValue('highContrastTables', v)
              updateAppearance({ highContrastTables: v })
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => resetAppearanceSection('tables')}
          >
            Restaurar tablas
          </Button>
        </div>

        <FormField label="Paleta de colores en gráficos">
          <div className="flex flex-wrap items-end gap-2">
            <Select {...register('chartPalette')} className="min-w-[180px]">
              <option value="default">Predeterminada</option>
              <option value="ocean">Océano</option>
              <option value="forest">Bosque</option>
              <option value="sunset">Atardecer</option>
            </Select>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => resetAppearanceSection('charts')}
            >
              Restaurar paleta
            </Button>
          </div>
        </FormField>

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
              <span
                className="rounded-md px-2 py-1 text-xs text-white"
                style={{ backgroundColor: watch('accentColor') }}
              >
                Acción
              </span>
              <span className="rounded-md border px-2 py-1 text-xs">Secundario</span>
            </div>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard
        title="Restablecimientos"
        subtitle="RF-37 / RF-38 — volver a valores de fábrica."
      >
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={resetAppearance}>
            Restablecer apariencia
          </Button>
          <Button type="button" variant="outline" onClick={resetDashboardLayout}>
            Restaurar módulos del dashboard
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (
                window.confirm(
                  '¿Restablecer toda la personalización de interfaz (tema, colores, layout)?',
                )
              ) {
                factoryResetUi()
              }
            }}
          >
            Restablecimiento total de fábrica
          </Button>
        </div>
      </SettingsCard>
    </form>
  )
}
