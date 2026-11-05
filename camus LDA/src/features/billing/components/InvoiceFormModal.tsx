import { useEffect, useMemo } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useBillingStore } from '@/store/useBillingStore'
import { useOrdersStore } from '@/store/useOrdersStore'
import { useClientsStore } from '@/store/useClientsStore'
import type { Invoice, InvoiceStatus } from '@/types'

interface InvoiceFormValues {
  clientId: string
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

/** Miles con punto (formato Chile), solo dígitos. */
function formatClpGrouped(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (!digits) return ''
  return Number(digits).toLocaleString('es-CL')
}

function parseClpInput(raw: string): number {
  return Number(raw.replace(/\D/g, '')) || 0
}

function addDaysIso(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T12:00:00`)
  if (Number.isNaN(d.getTime())) return isoDate
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export function InvoiceFormModal({ mode, invoice, open, onClose }: InvoiceFormModalProps) {
  const addInvoice = useBillingStore((s) => s.addInvoice)
  const updateInvoice = useBillingStore((s) => s.updateInvoice)
  const addToast = useBillingStore((s) => s.addToast)
  const orders = useOrdersStore((s) => s.orders)
  const syncOrders = useOrdersStore((s) => s.syncFromApi)
  const clients = useClientsStore((s) => s.clients)
  const syncClients = useClientsStore((s) => s.syncFromApi)

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<InvoiceFormValues>({
    defaultValues: {
      clientId: '',
      client: '',
      clientRut: '',
      orderId: '',
      issueDate: new Date().toISOString().slice(0, 10),
      dueDate: '',
      amount: '',
      status: 'Emitida',
      notes: '',
    },
  })

  const selectedClientId = useWatch({ control, name: 'clientId' })
  const issueDate = useWatch({ control, name: 'issueDate' })

  useEffect(() => {
    if (!open) return
    void syncOrders()
    void syncClients()
  }, [open, syncOrders, syncClients])

  useEffect(() => {
    if (!open) return
    if (mode === 'edit' && invoice) {
      reset({
        clientId: invoice.clientId ?? '',
        client: invoice.client,
        clientRut: invoice.clientRut,
        orderId: invoice.orderId ?? '',
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        amount: formatClpGrouped(String(invoice.amount)),
        status: invoice.status,
        notes: invoice.notes ?? '',
      })
    } else {
      const today = new Date().toISOString().slice(0, 10)
      reset({
        clientId: '',
        client: '',
        clientRut: '',
        orderId: '',
        issueDate: today,
        dueDate: addDaysIso(today, 30),
        amount: '',
        status: 'Emitida',
        notes: '',
      })
    }
  }, [open, mode, invoice, reset])

  const clientOptions = useMemo(
    () =>
      [...clients].sort((a, b) =>
        (a.name || a.company).localeCompare(b.name || b.company, 'es'),
      ),
    [clients],
  )

  const orderOptions = useMemo(() => {
    const list = selectedClientId
      ? orders.filter((o) => {
          const client = clients.find((c) => c.id === selectedClientId)
          if (!client) return true
          return (
            o.client.localeCompare(client.name, 'es', { sensitivity: 'accent' }) === 0 ||
            o.client.localeCompare(client.company, 'es', { sensitivity: 'accent' }) === 0
          )
        })
      : orders
    return [...list].sort((a, b) => b.id.localeCompare(a.id))
  }, [orders, clients, selectedClientId])

  const applyClientSelection = (clientId: string) => {
    setValue('clientId', clientId, { shouldValidate: true })
    setValue('orderId', '')
    const client = clients.find((c) => c.id === clientId)
    if (!client) {
      setValue('client', '')
      setValue('clientRut', '')
      return
    }
    setValue('client', client.name || client.company, { shouldValidate: true })
    setValue('clientRut', client.rut, { shouldValidate: true })
  }

  const applyOrderSelection = (orderId: string) => {
    setValue('orderId', orderId)
    if (!orderId) return
    const order = orders.find((o) => o.id === orderId)
    if (!order) return
    const match = clients.find(
      (c) =>
        c.name.localeCompare(order.client, 'es', { sensitivity: 'accent' }) === 0 ||
        c.company.localeCompare(order.client, 'es', { sensitivity: 'accent' }) === 0,
    )
    if (match) {
      setValue('clientId', match.id, { shouldValidate: true })
      setValue('client', match.name || match.company, { shouldValidate: true })
      setValue('clientRut', match.rut, { shouldValidate: true })
    } else {
      setValue('client', order.client, { shouldValidate: true })
    }
  }

  const onIssueDateChange = (value: string) => {
    setValue('issueDate', value, { shouldValidate: true })
    if (mode === 'create' || !invoice?.dueDate) {
      setValue('dueDate', addDaysIso(value, 30), { shouldValidate: true })
    }
  }

  const onSubmit = async (data: InvoiceFormValues) => {
    const amount = parseClpInput(data.amount)
    const payload = {
      clientId: data.clientId || undefined,
      client: data.client,
      clientRut: data.clientRut,
      orderId: data.orderId || undefined,
      issueDate: data.issueDate,
      dueDate: data.dueDate || addDaysIso(data.issueDate || issueDate, 30),
      amount,
      status: data.status,
      notes: data.notes || undefined,
    }

    if (mode === 'create') {
      const result = await addInvoice(payload)
      if (!result.ok) {
        addToast(result.message ?? 'No se pudo crear la factura', 'error')
        return
      }
      addToast(
        result.message ??
          `Factura para "${data.client}" creada correctamente`,
      )
    } else if (invoice) {
      const result = await updateInvoice(invoice.id, payload)
      if (!result.ok) {
        addToast(result.message ?? 'No se pudo actualizar la factura', 'error')
        return
      }
      addToast(result.message ?? `Factura ${invoice.number} actualizada`)
    }
    onClose()
  }

  const statusLocked = mode === 'edit' && invoice?.status === 'Pagada'

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === 'create' ? 'Nueva Factura' : 'Editar Factura'}
      description={
        mode === 'create'
          ? 'Registra una nueva factura vinculada a un cliente del sistema.'
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
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <FormField label="Cliente" error={errors.clientId?.message || errors.client?.message}>
          <Select
            {...register('clientId', { required: 'Selecciona un cliente' })}
            onChange={(e) => applyClientSelection(e.target.value)}
          >
            <option value="">Seleccionar cliente…</option>
            {clientOptions.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name || client.company} — {client.rut}
              </option>
            ))}
          </Select>
        </FormField>
        <input type="hidden" {...register('client', { required: 'Cliente requerido' })} />
        <input type="hidden" {...register('clientRut', { required: 'RUT requerido' })} />

        <FormField label="Orden de Trabajo (opcional)">
          <Select
            {...register('orderId')}
            onChange={(e) => applyOrderSelection(e.target.value)}
          >
            <option value="">Sin orden asociada</option>
            {orderOptions.map((order) => (
              <option key={order.id} value={order.id}>
                {order.id} — {order.client}
                {order.service ? ` · ${order.service}` : ''} ({order.status})
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Estado" error={errors.status?.message}>
          <Select
            {...register('status', { required: true })}
            disabled={statusLocked}
          >
            <option value="Borrador">Borrador</option>
            <option value="Emitida">Emitida</option>
            {mode === 'edit' && <option value="Pagada">Pagada</option>}
            {mode === 'edit' && <option value="Vencida">Vencida</option>}
            <option value="Anulada">Anulada</option>
          </Select>
        </FormField>
        <FormField label="Fecha de emisión" error={errors.issueDate?.message}>
          <Input
            type="date"
            {...register('issueDate', {
              required: 'Fecha requerida',
              onChange: (e) => onIssueDateChange(e.target.value),
            })}
          />
        </FormField>
        <FormField label="Fecha de vencimiento" error={errors.dueDate?.message}>
          <Input
            type="date"
            {...register('dueDate', { required: 'Vencimiento requerido' })}
          />
        </FormField>
        <FormField label="Monto (CLP)" error={errors.amount?.message}>
          <Controller
            name="amount"
            control={control}
            rules={{
              required: 'Monto requerido',
              validate: (v) => parseClpInput(v) > 0 || 'Monto inválido',
            }}
            render={({ field }) => (
              <Input
                inputMode="numeric"
                placeholder="1.500.000"
                value={field.value}
                onBlur={field.onBlur}
                name={field.name}
                ref={field.ref}
                disabled={statusLocked}
                onChange={(e) => field.onChange(formatClpGrouped(e.target.value))}
              />
            )}
          />
        </FormField>
        <FormField label="Notas" className="sm:col-span-2">
          <Input {...register('notes')} placeholder="Observaciones opcionales" />
        </FormField>
      </form>
    </Modal>
  )
}
