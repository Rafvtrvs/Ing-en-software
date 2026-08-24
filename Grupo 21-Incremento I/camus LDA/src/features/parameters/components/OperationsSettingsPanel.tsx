import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Switch } from '@/components/ui/Switch'
import { useParametersStore } from '@/store/useParametersStore'
import type { OperationParameters } from '@/types'
import { ParameterCard } from './ParameterCard'

export function OperationsSettingsPanel() {
  const operations = useParametersStore((s) => s.parameters.operations)
  const updateOperations = useParametersStore((s) => s.updateOperations)
  const addToast = useParametersStore((s) => s.addToast)

  const { register, handleSubmit, reset, watch, setValue } = useForm<OperationParameters>({
    defaultValues: operations,
  })

  useEffect(() => {
    reset(operations)
  }, [operations, reset])

  const onSubmit = (data: OperationParameters) => {
    updateOperations({
      ...data,
      gpsUpdateIntervalMinutes: Number(data.gpsUpdateIntervalMinutes),
      maxOrdersPerTechnician: Number(data.maxOrdersPerTechnician),
      geofenceRadiusMeters: Number(data.geofenceRadiusMeters),
    })
    addToast('Parámetros de operaciones guardados correctamente')
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <ParameterCard
        title="Operaciones en Terreno"
        subtitle="App móvil, GPS y límites operativos."
        footer={<Button type="submit">Guardar cambios</Button>}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Intervalo GPS (minutos)">
            <Input
              type="number"
              min={1}
              {...register('gpsUpdateIntervalMinutes', { valueAsNumber: true })}
            />
          </FormField>
          <FormField label="Máx. órdenes por técnico / día">
            <Input
              type="number"
              min={1}
              {...register('maxOrdersPerTechnician', { valueAsNumber: true })}
            />
          </FormField>
        </div>
        <FormField label="Radio geocerca (metros)">
          <Input type="number" min={50} {...register('geofenceRadiusMeters', { valueAsNumber: true })} />
        </FormField>

        <div className="space-y-4 rounded-xl border border-slate-100 bg-slate-50/50 p-4">
          <Switch
            id="offline"
            label="Modo sin conexión"
            description="Permite registrar avances offline y sincronizar después."
            checked={watch('allowOfflineMode')}
            onChange={(v) => setValue('allowOfflineMode', v)}
          />
          <Switch
            id="photo"
            label="Foto obligatoria al completar"
            description="El técnico debe adjuntar evidencia fotográfica."
            checked={watch('requirePhotoOnComplete')}
            onChange={(v) => setValue('requirePhotoOnComplete', v)}
          />
        </div>
      </ParameterCard>
    </form>
  )
}
