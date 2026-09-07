import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useOrdersStore } from '@/store/useOrdersStore'
import { useInventoryStore } from '@/store/useInventoryStore'
import { useUsersStore } from '@/store/useUsersStore'
import { useSessionUser } from '@/features/auth/useSessionUser'
import { getOrderFieldChanges } from '@/features/orders/utils/orderFieldChanges'
import {
  canEditOrder,
  orderEditBlockedMessage,
} from '@/features/orders/utils/canEditOrder'
import { calcDurationHours, toInputDate } from '@/features/orders/utils/orderDates'
import {
  autoPriorityForIncident,
  INCIDENT_TYPES,
} from '@/features/orders/utils/priorityRules'
import type {
  IncidentType,
  OrderPriority,
  OrderStatus,
  WorkOrder,
} from '@/types'
import { cn } from '@/utils/cn'

interface OrderFormValues {
  id: string
  client: string
  address: string
  service: string
  category: string
  incidentType: IncidentType
  status: OrderStatus
  priority: OrderPriority
  priorityManual: boolean
  technician: string
  operatorIds: string[]
  truckCode: string
  progress: number
  startDate: string
  endDate: string
  durationHours: number | undefined
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
  const users = useUsersStore((s) => s.users)
  const roles = useUsersStore((s) => s.roles)
  const currentUser = useSessionUser()

  const trucks = useMemo(
    () => products.filter((p) => p.category === 'Camiones' && p.currentStock > 0),
    [products],
  )

  const technicians = useMemo(() => {
    const techRoleIds = new Set(
      roles
        .filter((r) => {
          const n = r.name.toLowerCase()
          return (
            n.includes('técnico') ||
            n.includes('tecnico') ||
            n.includes('operador') ||
            n.includes('campo')
          )
        })
        .map((r) => r.id),
    )
    return users.filter(
      (u) => u.status === 'Activo' && techRoleIds.has(u.roleId),
    )
  }, [users, roles])

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<OrderFormValues>({
    defaultValues: {
      id: '',
      client: '',
      address: '',
      service: '',
      category: 'Obstrucción',
      incidentType: 'Obstrucción',
      status: 'Pendiente',
      priority: 'Media',
      priorityManual: false,
      technician: '',
      operatorIds: [],
      truckCode: '',
      progress: 0,
      startDate: '',
      endDate: '',
      durationHours: undefined,
    },
  })

  const operatorIds = watch('operatorIds')
  const incidentType = watch('incidentType')
  const priorityManual = watch('priorityManual')
  const startDate = watch('startDate')
  const endDate = watch('endDate')

  useEffect(() => {
    if (!open) return
    if (mode === 'edit' && order) {
      if (!canEditOrder(currentUser, order)) {
        addToast(orderEditBlockedMessage(order), 'error')
        onClose()
        return
      }
      reset({
        id: order.id,
        client: order.client,
        address: order.address,
        service: order.service ?? '',
        category: order.category,
        incidentType:
          (order.incidentType as IncidentType) ??
          (order.category as IncidentType) ??
          'Obstrucción',
        status: order.status,
        priority: order.priority ?? 'Media',
        priorityManual: Boolean(order.priorityManual),
        technician: order.technician ?? '',
        operatorIds: order.operatorIds ?? [],
        truckCode: order.truckCode ?? '',
        progress: order.progress ?? 0,
        startDate: toInputDate(order.startDate),
        endDate: toInputDate(order.endDate),
        durationHours: order.durationHours,
      })
    } else {
      reset({
        id: '',
        client: '',
        address: '',
        service: '',
        category: 'Obstrucción',
        incidentType: 'Obstrucción',
        status: 'Pendiente',
        priority: 'Media',
        priorityManual: false,
        technician: '',
        operatorIds: [],
        truckCode: '',
        progress: 0,
        startDate: '',
        endDate: '',
        durationHours: undefined,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- currentUser from auth is stable enough per open
  }, [open, mode, order, reset])

  useEffect(() => {
    if (!priorityManual) {
      setValue('priority', autoPriorityForIncident(incidentType))
    }
  }, [incidentType, priorityManual, setValue])

  useEffect(() => {
    const calc = calcDurationHours(startDate, endDate)
    if (calc !== undefined) setValue('durationHours', calc)
  }, [startDate, endDate, setValue])

  const toggleOperator = (id: string) => {
    const next = operatorIds.includes(id)
      ? operatorIds.filter((x) => x !== id)
      : [...operatorIds, id]
    setValue('operatorIds', next, { shouldDirty: true })
    const first = technicians.find((t) => t.id === next[0])
    setValue('technician', first?.name ?? '', { shouldDirty: true })
  }

  const onSubmit = (data: OrderFormValues) => {
    const operators = data.operatorIds
      .map((id) => {
        const u = technicians.find((t) => t.id === id)
        return u ? { id: u.id, name: u.name } : null
      })
      .filter(Boolean) as WorkOrder['operators']

    const payload: WorkOrder = {
      id: data.id.trim(),
      client: data.client.trim(),
      address: data.address.trim(),
      service: data.service.trim(),
      category: data.incidentType || data.category,
      incidentType: data.incidentType,
      status: data.status,
      createdAt: order?.createdAt ?? new Date().toLocaleDateString('es-CL'),
      priority: data.priority,
      priorityManual: data.priorityManual,
      technician:
        data.technician.trim() ||
        operators?.[0]?.name ||
        '',
      operatorIds: data.operatorIds,
      operators,
      ...(data.truckCode ? { truckCode: data.truckCode } : null),
      progress: Number.isFinite(data.progress) ? Number(data.progress) : 0,
      startDate: data.startDate || undefined,
      endDate: data.endDate || undefined,
      durationHours:
        data.durationHours != null && Number.isFinite(data.durationHours)
          ? Number(data.durationHours)
          : undefined,
      photoUrls: order?.photoUrls,
      thirdParties: order?.thirdParties,
      equipmentId: order?.equipmentId,
    }

    if (mode === 'create') {
      addOrder(payload)
      addToast(`Orden creada para "${payload.client}"`)
    } else if (order) {
      if (!canEditOrder(currentUser, order)) {
        addToast(orderEditBlockedMessage(order), 'error')
        onClose()
        return
      }
      const changes = getOrderFieldChanges(order, payload)
      if (changes.length === 0 && JSON.stringify(order.operatorIds ?? []) === JSON.stringify(payload.operatorIds ?? [])) {
        addToast('No hay cambios para guardar', 'info')
        onClose()
        return
      }
      updateOrder(order.id, payload, { fromForm: true })
      addToast(
        changes.length === 1
          ? `Campo "${changes[0].label}" actualizado en la orden`
          : `${Math.max(changes.length, 1)} campos actualizados en la orden`,
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
          <FormField label="Tipo de incidente" htmlFor="incidentType" required>
            <Select id="incidentType" {...register('incidentType')}>
              {INCIDENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
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

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FormField label="Prioridad" htmlFor="priority" required>
            <Select
              id="priority"
              {...register('priority')}
              disabled={!priorityManual}
            >
              <option value="Urgente">Urgente</option>
              <option value="Alta">Alta</option>
              <option value="Media">Media</option>
              <option value="Baja">Baja</option>
            </Select>
          </FormField>
          <FormField label="Prioridad manual" htmlFor="priorityManual">
            <label className="flex h-10 items-center gap-2 text-sm text-slate-700">
              <input
                id="priorityManual"
                type="checkbox"
                checked={priorityManual}
                onChange={(e) =>
                  setValue('priorityManual', e.target.checked, {
                    shouldDirty: true,
                  })
                }
                className="rounded border-slate-300 text-primary focus:ring-primary"
              />
              Fijar manualmente
            </label>
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
        </div>

        <FormField
          label="Operadores / técnicos (cuadrilla)"
          htmlFor="operators"
        >
          <div className="max-h-36 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-2">
            {technicians.length === 0 ? (
              <p className="text-xs text-slate-500">No hay técnicos activos.</p>
            ) : (
              technicians.map((t) => {
                const checked = operatorIds.includes(t.id)
                return (
                  <label
                    key={t.id}
                    className={cn(
                      'flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm',
                      checked ? 'bg-primary/5' : 'hover:bg-slate-50',
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleOperator(t.id)}
                      className="rounded border-slate-300 text-primary focus:ring-primary"
                    />
                    {t.name}
                  </label>
                )
              })
            )}
          </div>
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FormField label="Fecha inicio" htmlFor="startDate">
            <Input id="startDate" type="date" {...register('startDate')} />
          </FormField>
          <FormField label="Fecha término" htmlFor="endDate">
            <Input id="endDate" type="date" {...register('endDate')} />
          </FormField>
          <FormField label="Duración (h)" htmlFor="durationHours">
            <Input
              id="durationHours"
              type="number"
              min={0}
              step={0.5}
              {...register('durationHours', { valueAsNumber: true })}
            />
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
