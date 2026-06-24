import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useOrdersStore } from '@/store/useOrdersStore'
import { useInventoryStore } from '@/store/useInventoryStore'
import { getOrderFieldChanges } from '@/features/orders/utils/orderFieldChanges'
import type { OrderStatus, WorkOrder } from '@/types'

interface OrderFormValues {
  id: string
  client: string
  address: string
  service: string
  category: string
  status: OrderStatus
  priority: 'Baja' | 'Media' | 'Alta'
  technician: string
  truckCode: string
  progress: number
}

interface OrderFormModalProps {
  mode: 'create' | 'edit'
  order?: WorkOrder | null
  open: boolean
  onClose: () => void
}

export function OrderFormModal({ mode, order, open, onClose }: OrderFormModalProps) {
  const addOrder = useOrdersStore((s) => s.addOrder)
  const updateOrder = useOrdersStore((s) => s.updateOrder)
  const addToast = useOrdersStore((s) => s.addToast)
  const products = useInventoryStore((s) => s.products)
  const trucks = useMemo(
    () => products.filter((p) => p.category === 'Camiones' && p.currentStock > 0),
    [products],
  )

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<OrderFormValues>({
    defaultValues: {
      id: '',
      client: '',
      address: '',
      service: '',
      category: 'Obstrucción',
      status: 'Pendiente',
      priority: 'Media',
      technician: '',
      truckCode: '',
      progress: 0,
    },
  })

  useEffect(() => {
    if (!open) return
    if (mode === 'edit' && order) {
      reset({
        id: order.id,
        client: order.client,
        address: order.address,
        service: order.service ?? '',
        category: order.category,
        status: order.status,
        priority: order.priority ?? 'Media',
        technician: order.technician ?? '',
        truckCode: order.truckCode ?? '',
        progress: order.progress ?? 0,
      })
    } else {
      reset({
        id: '',
        client: '',
        address: '',
        service: '',
        category: 'Obstrucción',
        status: 'Pendiente',
        priority: 'Media',
        technician: '',
        truckCode: '',
        progress: 0,
      })
    }
  }, [open, mode, order, reset])

  const onSubmit = (data: OrderFormValues) => {
    const payload: WorkOrder = {
      id: data.id.trim(),
      client: data.client.trim(),
      address: data.address.trim(),
      service: data.service.trim(),
      category: data.category,
      status: data.status,
      createdAt: order?.createdAt ?? new Date().toLocaleDateString('es-CL'),
      priority: data.priority,
      technician: data.technician.trim(),
      ...(data.truckCode ? { truckCode: data.truckCode } : null),
      progress: Number.isFinite(data.progress) ? Number(data.progress) : 0,
    }

    if (mode === 'create') {
      addOrder(payload)
      addToast(`Orden creada para "${payload.client}"`)
    } else if (order) {
      const changes = getOrderFieldChanges(order, payload)
      if (changes.length === 0) {
        addToast('No hay cambios para guardar', 'info')
        onClose()
        return
      }
      updateOrder(order.id, payload, { fromForm: true })
      addToast(
        changes.length === 1
          ? `Campo "${changes[0].label}" actualizado en la orden`
          : `${changes.length} campos actualizados en la orden`,
      )
    }
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === 'create' ? 'Nueva Orden de Trabajo' : 'Editar Orden de Trabajo'}
      description="Completa los datos principales de la orden."
      size="lg"
      footer={
        <>
          <Button variant="outline" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="order-form" disabled={isSubmitting}>
            {mode === 'create' ? 'Crear Orden' : 'Guardar Cambios'}
          </Button>
        </>
      }
    >
      <form id="order-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="ID Orden (opcional)" htmlFor="id">
            <Input id="id" placeholder="Ej: OT-2026-0130" {...register('id')} />
          </FormField>
          <FormField label="Cliente" htmlFor="client" error={errors.client?.message} required>
            <Input
              id="client"
              placeholder="Ej: Comercial XYZ Ltda."
              {...register('client', { required: 'El cliente es obligatorio' })}
              className={errors.client ? 'border-red-300' : undefined}
            />
          </FormField>
        </div>

        <FormField label="Dirección" htmlFor="address" error={errors.address?.message} required>
          <Input
            id="address"
            placeholder="Ej: Av. Providencia 1234"
            {...register('address', { required: 'La dirección es obligatoria' })}
            className={errors.address ? 'border-red-300' : undefined}
          />
        </FormField>

        <FormField label="Descripción / Servicio" htmlFor="service" error={errors.service?.message} required>
          <Input
            id="service"
            placeholder="Ej: Desobstrucción alcantarillado"
            {...register('service', { required: 'La descripción es obligatoria' })}
            className={errors.service ? 'border-red-300' : undefined}
          />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Categoría" htmlFor="category" required>
            <Select id="category" {...register('category')}>
              <option value="Obstrucción">Obstrucción</option>
              <option value="Rotura de Tubería">Rotura de Tubería</option>
              <option value="Rebalse">Rebalse</option>
              <option value="Mantención">Mantención</option>
              <option value="Otros">Otros</option>
            </Select>
          </FormField>
          <FormField label="Estado" htmlFor="status" required>
            <Select id="status" {...register('status')}>
              <option value="Pendiente">Pendiente</option>
              <option value="En Curso">En Curso</option>
              <option value="Abonado">Abonado</option>
              <option value="Completada">Completada</option>
              <option value="Cancelada">Cancelada</option>
            </Select>
          </FormField>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FormField label="Prioridad" htmlFor="priority" required>
            <Select id="priority" {...register('priority')}>
              <option value="Baja">Baja</option>
              <option value="Media">Media</option>
              <option value="Alta">Alta</option>
            </Select>
          </FormField>
          <FormField label="Técnico" htmlFor="technician">
            <Input id="technician" placeholder="Ej: Luis Torres" {...register('technician')} />
          </FormField>
          <FormField label="Camión asignado" htmlFor="truckCode">
            <Select id="truckCode" {...register('truckCode')}>
              <option value="">Sin asignar</option>
              {trucks.map((t) => (
                <option key={t.id} value={t.code}>
                  {t.code} — {t.name}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Progreso (%)" htmlFor="progress">
            <Input
              id="progress"
              type="number"
              min={0}
              max={100}
              {...register('progress', { valueAsNumber: true })}
            />
          </FormField>
        </div>
      </form>
    </Modal>
  )
}

