import { useForm } from 'react-hook-form'
import { Mail, MessageSquare, Phone } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useSupportStore } from '@/store/useSupportStore'
import type { SupportTicketPriority } from '@/types'

interface ContactFormValues {
  subject: string
  category: string
  message: string
  priority: SupportTicketPriority
}

export function ContactSupportPanel() {
  const submitContact = useSupportStore((s) => s.submitContact)
  const setActiveTab = useSupportStore((s) => s.setActiveTab)

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<ContactFormValues>({
    defaultValues: {
      subject: '',
      category: 'General',
      message: '',
      priority: 'Media',
    },
  })

  const onSubmit = (data: ContactFormValues) => {
    submitContact(data)
    reset()
    setActiveTab('tickets')
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader
            title="Contactar Soporte"
            subtitle="Describe tu problema y crearemos un ticket de seguimiento."
          />
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FormField label="Asunto" required>
              <Input
                placeholder="Resumen breve del problema"
                {...register('subject', { required: true })}
              />
            </FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Categoría">
                <Select {...register('category')}>
                  <option value="General">General</option>
                  <option value="Órdenes">Órdenes</option>
                  <option value="Inventario">Inventario</option>
                  <option value="Facturación">Facturación</option>
                  <option value="Técnico">Problema técnico</option>
                </Select>
              </FormField>
              <FormField label="Prioridad">
                <Select {...register('priority')}>
                  <option value="Baja">Baja</option>
                  <option value="Media">Media</option>
                  <option value="Alta">Alta</option>
                </Select>
              </FormField>
            </div>
            <FormField label="Mensaje" required>
              <textarea
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                rows={5}
                placeholder="Detalla tu consulta o incidencia..."
                {...register('message', { required: true })}
              />
            </FormField>
            <Button type="submit" disabled={isSubmitting}>
              Enviar solicitud
            </Button>
          </form>
        </Card>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader title="Canales de contacto" />
          <ul className="space-y-4 text-sm">
            <li className="flex gap-3">
              <Mail className="h-5 w-5 shrink-0 text-primary" />
              <div>
                <p className="font-medium text-slate-900">Email</p>
                <p className="text-slate-500">soporte@camus.cl</p>
              </div>
            </li>
            <li className="flex gap-3">
              <Phone className="h-5 w-5 shrink-0 text-primary" />
              <div>
                <p className="font-medium text-slate-900">Teléfono</p>
                <p className="text-slate-500">+56 2 2345 6789</p>
              </div>
            </li>
            <li className="flex gap-3">
              <MessageSquare className="h-5 w-5 shrink-0 text-primary" />
              <div>
                <p className="font-medium text-slate-900">Horario</p>
                <p className="text-slate-500">Lun–Vie, 08:00 – 18:00</p>
              </div>
            </li>
          </ul>
        </Card>

        <Card className="border-emerald-100 bg-emerald-50/50">
          <p className="text-sm font-medium text-emerald-800">Estado del sistema</p>
          <p className="mt-1 flex items-center gap-2 text-sm text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Todos los servicios operativos
          </p>
        </Card>
      </div>
    </div>
  )
}
