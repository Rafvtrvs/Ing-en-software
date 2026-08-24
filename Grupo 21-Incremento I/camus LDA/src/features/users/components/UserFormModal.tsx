import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useUsersStore } from '@/store/useUsersStore'
import type { SystemUser, SystemUserStatus } from '@/types'

interface UserFormValues {
  name: string
  email: string
  phone: string
  roleId: string
  status: SystemUserStatus
}

interface UserFormModalProps {
  mode: 'create' | 'edit'
  user?: SystemUser | null
  open: boolean
  onClose: () => void
}

export function UserFormModal({ mode, user, open, onClose }: UserFormModalProps) {
  const roles = useUsersStore((s) => s.roles)
  const addUser = useUsersStore((s) => s.addUser)
  const updateUser = useUsersStore((s) => s.updateUser)
  const addToast = useUsersStore((s) => s.addToast)

  const activeRoles = roles.filter((r) => r.status === 'Activo')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UserFormValues>({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      roleId: activeRoles[0]?.id ?? '',
      status: 'Activo',
    },
  })

  useEffect(() => {
    if (!open) return
    if (mode === 'edit' && user) {
      reset({
        name: user.name,
        email: user.email,
        phone: user.phone,
        roleId: user.roleId,
        status: user.status,
      })
    } else {
      reset({
        name: '',
        email: '',
        phone: '',
        roleId: activeRoles[0]?.id ?? '',
        status: 'Activo',
      })
    }
  }, [open, mode, user, reset, activeRoles])

  const onSubmit = (data: UserFormValues) => {
    if (mode === 'create') {
      addUser(data)
      addToast(`Usuario "${data.name}" creado correctamente`)
    } else if (user) {
      updateUser(user.id, data)
      addToast(`Usuario "${data.name}" actualizado correctamente`)
    }
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === 'create' ? 'Nuevo Usuario' : 'Editar Usuario'}
      description={
        mode === 'create'
          ? 'Registra un nuevo usuario con rol y permisos asignados.'
          : 'Modifica los datos del usuario seleccionado.'
      }
      size="lg"
      footer={
        <>
          <Button variant="outline" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="user-form" disabled={isSubmitting}>
            {mode === 'create' ? 'Crear Usuario' : 'Guardar Cambios'}
          </Button>
        </>
      }
    >
      <form id="user-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Nombre completo" error={errors.name?.message} required>
            <Input
              placeholder="Ej: Carlos Mendoza"
              {...register('name', { required: 'El nombre es obligatorio' })}
            />
          </FormField>
          <FormField label="Email" error={errors.email?.message} required>
            <Input
              type="email"
              placeholder="usuario@camus.cl"
              {...register('email', {
                required: 'El email es obligatorio',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Email inválido',
                },
              })}
            />
          </FormField>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Teléfono" error={errors.phone?.message} required>
            <Input
              placeholder="+56 9 1234 5678"
              {...register('phone', { required: 'El teléfono es obligatorio' })}
            />
          </FormField>
          <FormField label="Rol" required>
            <Select {...register('roleId', { required: true })}>
              {activeRoles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </Select>
          </FormField>
        </div>
        <FormField label="Estado" required>
          <Select {...register('status')}>
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
            <option value="Bloqueado">Bloqueado</option>
          </Select>
        </FormField>
      </form>
    </Modal>
  )
}
