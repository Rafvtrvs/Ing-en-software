import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/Button'
import { Switch } from '@/components/ui/Switch'
import { useParametersStore } from '@/store/useParametersStore'
import type { NotificationParameters } from '@/types'
import { ParameterCard } from './ParameterCard'

export function NotificationsSettingsPanel() {
  const notifications = useParametersStore((s) => s.parameters.notifications)
  const updateNotifications = useParametersStore((s) => s.updateNotifications)
  const addToast = useParametersStore((s) => s.addToast)

  const { handleSubmit, reset, watch, setValue } = useForm<NotificationParameters>({
    defaultValues: notifications,
  })

  useEffect(() => {
    reset(notifications)
  }, [notifications, reset])

  const onSubmit = (data: NotificationParameters) => {
    updateNotifications(data)
    addToast('Preferencias de notificaciones guardadas')
  }

  const items: {
    key: keyof NotificationParameters
    label: string
    description: string
  }[] = [
    {
      key: 'emailNewOrder',
      label: 'Nueva orden de trabajo',
      description: 'Email al supervisor cuando se registra una OT.',
    },
    {
      key: 'emailOrderCompleted',
      label: 'Orden completada',
      description: 'Aviso al cliente y al área de facturación.',
    },
    {
      key: 'emailLowStock',
      label: 'Stock bajo o crítico',
      description: 'Alerta al encargado de inventario.',
    },
    {
      key: 'emailInvoiceDue',
      label: 'Factura por vencer',
      description: 'Recordatorio según días configurados en facturación.',
    },
    {
      key: 'emailDailySummary',
      label: 'Resumen diario',
      description: 'KPIs y pendientes cada día a las 08:00.',
    },
    {
      key: 'pushFieldUpdates',
      label: 'Actualizaciones en terreno (app móvil)',
      description: 'Push cuando un técnico cambia estado o ubicación.',
    },
  ]

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <ParameterCard
        title="Notificaciones"
        subtitle="Correos y alertas automáticas del sistema."
        footer={<Button type="submit">Guardar cambios</Button>}
      >
        <div className="divide-y divide-slate-100">
          {items.map((item) => (
            <div key={item.key} className="py-4 first:pt-0 last:pb-0">
              <Switch
                id={item.key}
                label={item.label}
                description={item.description}
                checked={watch(item.key)}
                onChange={(v) => setValue(item.key, v)}
              />
            </div>
          ))}
        </div>
      </ParameterCard>
    </form>
  )
}
