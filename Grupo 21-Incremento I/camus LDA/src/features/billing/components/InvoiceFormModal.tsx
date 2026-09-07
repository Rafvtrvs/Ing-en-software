import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useBillingStore } from '@/store/useBillingStore'
import type { Invoice, InvoiceStatus } from '@/types'

interface InvoiceFormValues {
  client: string
  clientRut: string
  orderId: string
  issueDate: string
  dueDate: string
  amount: string
  status: InvoiceStatus
  notes: string
}

interface InvoiceFormModalProps {
  mode: 'create' | 'edit'
  invoice?: Invoice | null
  open: boolean
  onClose: () => void
}

export function InvoiceFormModal({ mode, invoice, open, onClose }: InvoiceFormModalProps) {
  const addInvoice = useBillingStore((s) => s.addInvoice)
  const updateInvoice = useBillingStore((s) => s.updateInvoice)
  const addToast = useBillingStore((s) => s.addToast)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InvoiceFormValues>({
    defaultValues: {
      client: '',
      clientRut: '',
      orderId: '',
      issueDate: new Date().toISOString().slice(0, 10),
      dueDate: '',
      amount: '',
      status: 'Borrador',
      notes: '',
    },
  })

  useEffect(() => {
    if (!open) return
    if (mode === 'edit' && invoice) {
      reset({
        client: invoice.client,
        clientRut: invoice.clientRut,
        orderId: invoice.orderId ?? '',
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        amount: String(invoice.amount),
        status: invoice.status,
        notes: invoice.notes ?? '',
      })
    } else {
      const today = new Date().toISOString().slice(0, 10)
      reset({
        client: '',
        clientRut: '',
        orderId: '',
        issueDate: today,
        dueDate: '',
        amount: '',
        status: 'Borrador',
        notes: '',
      })
    }
  }, [open, mode, invoice, reset])

  const onSubmit = (data: InvoiceFormValues) => {
    const amount = Number(data.amount.replace(/\D/g, '')) || 0
    const payload = {
      client: data.client,
      clientRut: data.clientRut,
      orderId: data.orderId || undefined,
      issueDate: data.issueDate,
      dueDate: data.dueDate,
      amount,
      status: data.status,
      notes: data.notes || undefined,
    }

    if (mode === 'create') {
      addInvoice(payload)
      addToast(`Factura para "${data.client}" creada correctamente`)
    } else if (invoice) {
      updateInvoice(invoice.id, payload)
      addToast(`Factura ${invoice.number} actualizada`)
    }
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === 'create' ? 'Nueva Factura' : 'Editar Factura'}
      description={
        mode === 'create'
          ? 'Registra una nueva factura para un cliente.'
          : 'Modifica los datos de la factura seleccionada.'
      }
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
            {mode === 'create' ? 'Crear Factura' : 'Guardar Cambios'}
          </Button>
        </>
      }
    >
      <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
        <FormField label="Cliente" error={errors.client?.message}>
          <Input
            {...register('client', { required: 'Cliente requerido' })}
            placeholder="Nombre o razón social"
          />
        </FormField>
        <FormField label="RUT Cliente" error={errors.clientRut?.message}>
          <Input
            {...register('clientRut', { required: 'RUT requerido' })}
            placeholder="12.345.678-9"
          />
        </FormField>
        <FormField label="Orden de Trabajo (opcional)">
          <Input {...register('orderId')} placeholder="OT-2026-0000" />
        </FormField>
        <FormField label="Estado" error={errors.status?.message}>
          <Select {...register('status', { required: true })}>
            <option value="Borrador">Borrador</option>
            <option value="Emitida">Emitida</option>
            <option value="Pagada">Pagada</option>
            <option value="Vencida">Vencida</option>
            <option value="Anulada">Anulada</option>
          </Select>
        </FormField>
        <FormField label="Fecha de emisión" error={errors.issueDate?.message}>
          <Input
            type="date"
            {...register('issueDate', { required: 'Fecha requerida' })}
          />
        </FormField>
        <FormField label="Fecha de vencimiento" error={errors.dueDate?.message}>
          <Input
            type="date"
            {...register('dueDate', { required: 'Vencimiento requerido' })}
          />
        </FormField>
        <FormField label="Monto (CLP)" error={errors.amount?.message}>
          <Input
            {...register('amount', {
              required: 'Monto requerido',
              validate: (v) => Number(v.replace(/\D/g, '')) > 0 || 'Monto inválido',
            })}
            placeholder="1500000"
          />
        </FormField>
        <FormField label="Notas" className="sm:col-span-2">
          <Input {...register('notes')} placeholder="Observaciones opcionales" />
        </FormField>
      </form>
    </Modal>
  )
}
