import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Switch } from '@/components/ui/Switch'
import { useParametersStore } from '@/store/useParametersStore'
import type { InventoryParameters } from '@/types'
import { ParameterCard } from './ParameterCard'

const UNITS = ['un', 'm', 'kg', 'lt', 'caja', 'rollo']

export function InventorySettingsPanel() {
  const inventory = useParametersStore((s) => s.parameters.inventory)
  const updateInventory = useParametersStore((s) => s.updateInventory)
  const addToast = useParametersStore((s) => s.addToast)

  const { register, handleSubmit, reset, watch, setValue } = useForm<InventoryParameters>({
    defaultValues: inventory,
  })

  useEffect(() => {
    reset(inventory)
  }, [inventory, reset])

  const onSubmit = (data: InventoryParameters) => {
    updateInventory({
      ...data,
      lowStockPercent: Number(data.lowStockPercent),
      criticalStockPercent: Number(data.criticalStockPercent),
    })
    addToast('Parámetros de inventario guardados correctamente')
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <ParameterCard
        title="Inventario y Stock"
        subtitle="Umbrales de alerta y unidades por defecto."
        footer={<Button type="submit">Guardar cambios</Button>}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Umbral stock bajo (% del mínimo)">
            <Input type="number" min={1} max={100} {...register('lowStockPercent', { valueAsNumber: true })} />
          </FormField>
          <FormField label="Umbral stock crítico (% del mínimo)">
            <Input
              type="number"
              min={1}
              max={100}
              {...register('criticalStockPercent', { valueAsNumber: true })}
            />
          </FormField>
        </div>
        <FormField label="Unidad por defecto (productos nuevos)">
          <Select {...register('defaultUnit')}>
            {UNITS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </Select>
        </FormField>

        <div className="space-y-4 rounded-xl border border-slate-100 bg-slate-50/50 p-4">
          <Switch
            id="lowAlert"
            label="Alertas de stock bajo"
            description="Notificar cuando un producto alcance el umbral bajo."
            checked={watch('enableLowStockAlerts')}
            onChange={(v) => setValue('enableLowStockAlerts', v)}
          />
          <Switch
            id="criticalAlert"
            label="Alertas de stock crítico"
            description="Notificación prioritaria para productos en nivel crítico."
            checked={watch('enableCriticalAlerts')}
            onChange={(v) => setValue('enableCriticalAlerts', v)}
          />
        </div>
      </ParameterCard>
    </form>
  )
}
