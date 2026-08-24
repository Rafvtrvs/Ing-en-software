import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useParametersStore } from '@/store/useParametersStore'
import type { GeneralParameters } from '@/types'
import { ParameterCard } from './ParameterCard'

const TIMEZONES = [
  { value: 'America/Santiago', label: 'Chile (Santiago)' },
  { value: 'America/Punta_Arenas', label: 'Chile (Punta Arenas)' },
  { value: 'America/Lima', label: 'Perú (Lima)' },
]

export function GeneralSettingsPanel() {
  const general = useParametersStore((s) => s.parameters.general)
  const updateGeneral = useParametersStore((s) => s.updateGeneral)
  const addToast = useParametersStore((s) => s.addToast)

  const { register, handleSubmit, reset } = useForm<GeneralParameters>({
    defaultValues: general,
  })

  useEffect(() => {
    reset(general)
  }, [general, reset])

  const onSubmit = (data: GeneralParameters) => {
    updateGeneral(data)
    addToast('Parámetros generales guardados correctamente')
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <ParameterCard
        title="Datos de la Empresa"
        subtitle="Información corporativa usada en documentos y comunicaciones."
        footer={
          <Button type="submit">Guardar cambios</Button>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Razón social" required>
            <Input {...register('companyName', { required: true })} />
          </FormField>
          <FormField label="RUT" required>
            <Input {...register('rut', { required: true })} />
          </FormField>
        </div>
        <FormField label="Dirección">
          <Input {...register('address')} />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Teléfono">
            <Input {...register('phone')} />
          </FormField>
          <FormField label="Email corporativo">
            <Input type="email" {...register('email')} />
          </FormField>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <FormField label="Horario inicio">
            <Input type="time" {...register('businessHoursStart')} />
          </FormField>
          <FormField label="Horario término">
            <Input type="time" {...register('businessHoursEnd')} />
          </FormField>
          <FormField label="Zona horaria">
            <Select {...register('timezone')}>
              {TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </Select>
          </FormField>
        </div>
      </ParameterCard>
    </form>
  )
}
