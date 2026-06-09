import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Switch } from '@/components/ui/Switch'
import { useParametersStore } from '@/store/useParametersStore'
import type { OrderParameters } from '@/types'
import { ParameterCard } from './ParameterCard'
import { CategoryTagsEditor } from './CategoryTagsEditor'

export function OrdersSettingsPanel() {
  const orders = useParametersStore((s) => s.parameters.orders)
  const updateOrders = useParametersStore((s) => s.updateOrders)
  const addToast = useParametersStore((s) => s.addToast)

  const { register, handleSubmit, reset, watch, setValue } = useForm<OrderParameters>({
    defaultValues: orders,
  })

  useEffect(() => {
    reset(orders)
  }, [orders, reset])

  const categories = watch('categories')

  const onSubmit = (data: OrderParameters) => {
    updateOrders({
      ...data,
      slaHoursHigh: Number(data.slaHoursHigh),
      slaHoursMedium: Number(data.slaHoursMedium),
      slaHoursLow: Number(data.slaHoursLow),
    })
    addToast('Parámetros de órdenes guardados correctamente')
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <ParameterCard
        title="Órdenes de Trabajo"
        subtitle="Prefijos, prioridades y tiempos de respuesta (SLA)."
        footer={<Button type="submit">Guardar cambios</Button>}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Prefijo de orden">
            <Input {...register('orderPrefix')} placeholder="OT" />
          </FormField>
          <FormField label="Prioridad por defecto">
            <Select {...register('defaultPriority')}>
              <option value="Baja">Baja</option>
              <option value="Media">Media</option>
              <option value="Alta">Alta</option>
            </Select>
          </FormField>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <FormField label="SLA prioridad Alta (horas)">
            <Input type="number" min={1} {...register('slaHoursHigh', { valueAsNumber: true })} />
          </FormField>
          <FormField label="SLA prioridad Media (horas)">
            <Input type="number" min={1} {...register('slaHoursMedium', { valueAsNumber: true })} />
          </FormField>
          <FormField label="SLA prioridad Baja (horas)">
            <Input type="number" min={1} {...register('slaHoursLow', { valueAsNumber: true })} />
          </FormField>
        </div>

        <div className="space-y-4 rounded-xl border border-slate-100 bg-slate-50/50 p-4">
          <Switch
            id="autoAssign"
            label="Asignación automática de técnico"
            description="Asigna el técnico disponible más cercano al crear la orden."
            checked={watch('autoAssignTechnician')}
            onChange={(v) => setValue('autoAssignTechnician', v)}
          />
          <Switch
            id="signature"
            label="Requerir firma del cliente"
            description="Obligatorio al marcar la orden como completada."
            checked={watch('requireClientSignature')}
            onChange={(v) => setValue('requireClientSignature', v)}
          />
        </div>
      </ParameterCard>

      <ParameterCard
        title="Categorías de Falla"
        subtitle="Tipos de servicio disponibles al crear órdenes."
      >
        <CategoryTagsEditor
          categories={categories}
          onChange={(cats) => setValue('categories', cats)}
        />
        <div className="mt-4">
          <Button type="submit">Guardar categorías y parámetros</Button>
        </div>
      </ParameterCard>
    </form>
  )
}
