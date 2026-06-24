import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useClientsStore } from '@/store/useClientsStore'
import { findDuplicateClient } from '@/features/clients/utils/clientDuplicates'
import type { Client, ClientStatus } from '@/types'

interface ClientFormValues {
  name: string
  company: string
  rut: string
  phone: string
  email: string
  status: ClientStatus
}

interface ClientFormModalProps {
  mode: 'create' | 'edit'
  client?: Client | null
  open: boolean
  onClose: () => void
}

export function ClientFormModal({ mode, client, open, onClose }: ClientFormModalProps) {
  const clients = useClientsStore((s) => s.clients)
  const addClient = useClientsStore((s) => s.addClient)
  const updateClient = useClientsStore((s) => s.updateClient)
  const addToast = useClientsStore((s) => s.addToast)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ClientFormValues>({
    defaultValues: {
      name: '',
      company: '',
      rut: '',
      phone: '',
      email: '',
      status: 'Activo',
    },
  })

  useEffect(() => {
    if (!open) return
    if (mode === 'edit' && client) {
      reset({
        name: client.name,
        company: client.company,
        rut: client.rut,
        phone: client.phone,
        email: client.email,
        status: client.status,
      })
    } else {
      reset({
        name: '',
        company: '',
        rut: '',
        phone: '',
        email: '',
        status: 'Activo',
      })
    }
  }, [open, mode, client, reset])

  const validateUnique = (data: ClientFormValues): boolean => {
    const duplicate = findDuplicateClient(
      clients,
      { rut: data.rut, email: data.email, phone: data.phone },
      mode === 'edit' ? client?.id : undefined,
    )
    if (!duplicate) return true

    setError(duplicate.field, { type: 'validate', message: duplicate.message })
    return false
  }

  const onSubmit = async (data: ClientFormValues) => {
    if (!validateUnique(data)) return

    if (mode === 'create') {
      const result = await addClient({
        ...data,
        lastOrder: '—',
        createdAt: new Date().toISOString(),
      })
      if (!result.ok) {
        if (result.field && result.message) {
          setError(result.field, { type: 'validate', message: result.message })
        }
        return
      }
      addToast(`Cliente "${data.name}" creado correctamente`)
    } else if (client) {
      const result = await updateClient(client.id, data)
      if (!result.ok) {
        if (result.field && result.message) {
          setError(result.field, { type: 'validate', message: result.message })
        }
        return
      }
      addToast(`Cliente "${data.name}" actualizado correctamente`)
    }
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === 'create' ? 'Nuevo Cliente' : 'Editar Cliente'}
      description={
        mode === 'create'
          ? 'Completa los datos para registrar un nuevo cliente.'
          : 'Modifica la información del cliente seleccionado.'
      }
      size="lg"
      footer={
        <>
          <Button variant="outline" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="client-form"
            disabled={isSubmitting}
          >
            {mode === 'create' ? 'Crear Cliente' : 'Guardar Cambios'}
          </Button>
        </>
      }
    >
      <form id="client-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Nombre completo" htmlFor="name" error={errors.name?.message} required>
            <Input
              id="name"
              placeholder="Ej: Carlos Mendoza"
              {...register('name', { required: 'El nombre es obligatorio' })}
              className={errors.name ? 'border-red-300' : undefined}
            />
          </FormField>
          <FormField label="Empresa" htmlFor="company" error={errors.company?.message} required>
            <Input
              id="company"
              placeholder="Ej: Comercial XYZ Ltda."
              {...register('company', { required: 'La empresa es obligatoria' })}
              className={errors.company ? 'border-red-300' : undefined}
            />
          </FormField>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="RUT" htmlFor="rut" error={errors.rut?.message} required>
            <Input
              id="rut"
              placeholder="Ej: 76.123.456-7"
              {...register('rut', {
                required: 'El RUT es obligatorio',
                validate: (value) => {
                  const duplicate = findDuplicateClient(
                    clients,
                    { rut: value, email: watch('email'), phone: watch('phone') },
                    mode === 'edit' ? client?.id : undefined,
                  )
                  return duplicate?.field === 'rut' ? duplicate.message : true
                },
              })}
              className={errors.rut ? 'border-red-300' : undefined}
            />
          </FormField>
          <FormField label="Teléfono" htmlFor="phone" error={errors.phone?.message} required>
            <Input
              id="phone"
              placeholder="Ej: +56 9 8765 4321"
              {...register('phone', {
                required: 'El teléfono es obligatorio',
                validate: (value) => {
                  const duplicate = findDuplicateClient(
                    clients,
                    { rut: watch('rut'), email: watch('email'), phone: value },
                    mode === 'edit' ? client?.id : undefined,
                  )
                  return duplicate?.field === 'phone' ? duplicate.message : true
                },
              })}
              className={errors.phone ? 'border-red-300' : undefined}
            />
          </FormField>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Email" htmlFor="email" error={errors.email?.message} required>
            <Input
              id="email"
              type="email"
              placeholder="Ej: contacto@empresa.cl"
              {...register('email', {
                required: 'El email es obligatorio',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Ingresa un email válido',
                },
                validate: (value) => {
                  const duplicate = findDuplicateClient(
                    clients,
                    { rut: watch('rut'), email: value, phone: watch('phone') },
                    mode === 'edit' ? client?.id : undefined,
                  )
                  return duplicate?.field === 'email' ? duplicate.message : true
                },
              })}
              className={errors.email ? 'border-red-300' : undefined}
            />
          </FormField>
          <FormField label="Estado" htmlFor="status" required>
            <Select id="status" {...register('status')}>
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Bloqueado">Bloqueado</option>
            </Select>
          </FormField>
        </div>
      </form>
    </Modal>
  )
}
