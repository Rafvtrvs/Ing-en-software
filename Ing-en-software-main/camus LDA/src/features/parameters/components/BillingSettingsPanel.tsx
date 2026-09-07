import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Switch } from '@/components/ui/Switch'
import { useParametersStore } from '@/store/useParametersStore'
import type { BillingParameters } from '@/types'
import { ParameterCard } from './ParameterCard'

export function BillingSettingsPanel() {
  const billing = useParametersStore((s) => s.parameters.billing)
  const updateBilling = useParametersStore((s) => s.updateBilling)
  const addToast = useParametersStore((s) => s.addToast)

  const { register, handleSubmit, reset, watch, setValue } = useForm<BillingParameters>({
    defaultValues: billing,
  })

  useEffect(() => {
    reset(billing)
  }, [billing, reset])

  const onSubmit = (data: BillingParameters) => {
    updateBilling({
      ...data,
      defaultDueDays: Number(data.defaultDueDays),
      taxRate: Number(data.taxRate),
      sendReminderDaysBefore: Number(data.sendReminderDaysBefore),
    })
    addToast('Parámetros de facturación guardados correctamente')
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <ParameterCard
        title="Facturación y Cobranza"
        subtitle="Numeración, plazos e impuestos aplicables."
        footer={<Button type="submit">Guardar cambios</Button>}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Prefijo de factura">
            <Input {...register('invoicePrefix')} placeholder="F" />
          </FormField>
          <FormField label="Días de vencimiento por defecto">
            <Input type="number" min={1} {...register('defaultDueDays', { valueAsNumber: true })} />
          </FormField>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="IVA (%)">
            <Input type="number" min={0} max={100} {...register('taxRate', { valueAsNumber: true })} />
          </FormField>
          <FormField label="Condiciones de pago">
            <Input {...register('defaultPaymentTerms')} placeholder="30 días" />
          </FormField>
        </div>
        <FormField label="Recordatorio antes del vencimiento (días)">
          <Input
            type="number"
            min={0}
            {...register('sendReminderDaysBefore', { valueAsNumber: true })}
          />
        </FormField>

        <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
          <Switch
            id="autoInvoice"
            label="Generar factura al completar orden"
            description="Crea borrador de factura automáticamente cuando una OT se marca como completada."
            checked={watch('autoGenerateFromCompletedOrders')}
            onChange={(v) => setValue('autoGenerateFromCompletedOrders', v)}
          />
        </div>
      </ParameterCard>
    </form>
  )
}
