import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Database, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Switch } from '@/components/ui/Switch'
import { useSettingsStore } from '@/store/useSettingsStore'
import { APP_VERSION } from '@/data/mock/settings'
import type { PlatformSystemSettings } from '@/types'
import { formatLastLogin } from '@/features/users/utils/userFormatters'
import { SettingsCard } from './SettingsCard'

export function SystemSettingsPanel() {
  const system = useSettingsStore((s) => s.config.system)
  const updateSystem = useSettingsStore((s) => s.updateSystem)
  const runBackup = useSettingsStore((s) => s.runBackup)
  const clearLocalData = useSettingsStore((s) => s.clearLocalData)
  const addToast = useSettingsStore((s) => s.addToast)

  const { handleSubmit, reset, watch, setValue } = useForm<PlatformSystemSettings>({
    defaultValues: system,
  })

  useEffect(() => {
    reset(system)
  }, [system, reset])

  const onSubmit = (data: PlatformSystemSettings) => {
    updateSystem(data)
    addToast('Configuración del sistema guardada')
  }

  const handleClear = () => {
    if (
      window.confirm(
        '¿Eliminar todos los datos locales? Se cerrará la sesión y se restaurarán valores de demostración.',
      )
    ) {
      clearLocalData()
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)}>
        <SettingsCard
          title="Sistema"
          subtitle="Modo mantención y opciones avanzadas."
          footer={<Button type="submit">Guardar sistema</Button>}
        >
          <div className="mb-4 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm">
            <span className="text-slate-600">Versión de la aplicación</span>
            <span className="font-semibold text-slate-900">v{APP_VERSION}</span>
          </div>
          <div className="mb-4 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm">
            <span className="text-slate-600">Última copia de seguridad</span>
            <span className="font-medium text-slate-900">
              {formatLastLogin(system.lastBackup)}
            </span>
          </div>
          <div className="space-y-4 rounded-xl border border-slate-100 bg-slate-50/50 p-4">
            <Switch
              id="maintenance"
              label="Modo mantención"
              description="Solo administradores pueden acceder al sistema."
              checked={watch('maintenanceMode')}
              onChange={(v) => setValue('maintenanceMode', v)}
            />
            <Switch
              id="debug"
              label="Modo depuración"
              description="Muestra información técnica adicional en consola."
              checked={watch('debugMode')}
              onChange={(v) => setValue('debugMode', v)}
            />
          </div>
        </SettingsCard>
      </form>

      <SettingsCard title="Datos y respaldo" subtitle="Exporta o restablece la información local.">
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="outline"
            leftIcon={<Database className="h-4 w-4" />}
            onClick={runBackup}
          >
            Descargar backup
          </Button>
          <Button
            type="button"
            variant="outline"
            className="border-red-200 text-red-600 hover:bg-red-50"
            leftIcon={<Trash2 className="h-4 w-4" />}
            onClick={handleClear}
          >
            Borrar datos locales
          </Button>
        </div>
        <p className="text-xs text-slate-500">
          El backup incluye clientes, órdenes, inventario, facturas y configuración guardada en
          este navegador.
        </p>
      </SettingsCard>
    </div>
  )
}
