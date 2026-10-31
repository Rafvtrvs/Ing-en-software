import { useEffect, useMemo } from 'react'
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
  password: string
}

interface UserFormModalProps {
  mode: 'create' | 'edit'
  user?: SystemUser | null
  open: boolean
  onClose: () => void
}

/** Mismo layout vertical que el formulario de OT en terreno (operador). */
export function UserFormModal({ mode, user, open, onClose }: UserFormModalProps) {
  const roles = useUsersStore((s) => s.roles)
  const createUserInDb = useUsersStore((s) => s.createUserInDb)
  const updateUserInDb = useUsersStore((s) => s.updateUserInDb)
  const updateUser = useUsersStore((s) => s.updateUser)
  const addToast = useUsersStore((s) => s.addToast)

  const activeRoles = useMemo(
    () => roles.filter((r) => r.status === 'Activo'),
    [roles],
  )
  const defaultRoleId = activeRoles[0]?.id ?? ''

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
      roleId: defaultRoleId,
      status: 'Activo',
      password: '',
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
        password: '',
      })
      return
    }
    reset({
      name: '',
      email: '',
      phone: '',
      roleId: defaultRoleId,
      status: 'Activo',
      password: '',
    })
  }, [open, mode, user, reset, defaultRoleId])

  const onSubmit = async (data: UserFormValues) => {
    if (!data.roleId) {
      addToast('Selecciona un rol activo para el usuario', 'error')
      return
    }
    const role = roles.find((r) => r.id === data.roleId)

    if (mode === 'create') {
      const result = await createUserInDb({
        name: data.name,
        email: data.email,
        phone: data.phone,
        roleId: data.roleId,
        roleName: role?.name,
        status: data.status,
        password: data.password,
      })
      if (result.ok) {
        addToast(
          `Usuario "${data.name}" creado en PostgreSQL. Puede iniciar sesión con ${data.email}`,
        )
        onClose()
        return
      }
      addToast(result.message, 'error')
      return
    }

    if (user) {
      const isDbUser = /^\d+$/.test(user.id)
      if (isDbUser) {
        const result = await updateUserInDb(user.id, {
          name: data.name,
          email: data.email,
          phone: data.phone,
          roleId: data.roleId,
          roleName: role?.name,
          status: data.status,
          ...(data.password ? { password: data.password } : {}),
        })
        if (result.ok) {
          addToast(`Usuario "${data.name}" actualizado en PostgreSQL`)
          onClose()
          return
        }
        addToast(result.message, 'error')
        return
      }
      updateUser(user.id, {
        name: data.name,
        email: data.email,
        phone: data.phone,
        roleId: data.roleId,
        status: data.status,
      })
      addToast(`Usuario "${data.name}" actualizado localmente`)
      onClose()
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === 'create' ? 'Nuevo Usuario' : 'Editar Usuario'}
      description={
        mode === 'create'
          ? 'Se guarda en PostgreSQL con contraseña para iniciar sesión.'
          : 'Modifica los datos del usuario. La contraseña es opcional.'
      }
      size="lg"
      footer={
        <>
          <Button variant="outline" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="user-form" disabled={isSubmitting}>
            {isSubmitting
              ? 'Guardando…'
              : mode === 'create'
                ? 'Crear Usuario'
                : 'Guardar Cambios'}
          </Button>
        </>
      }
    >
      <form id="user-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
        <FormField
          label={mode === 'create' ? 'Contraseña' : 'Nueva contraseña (opcional)'}
          error={errors.password?.message}
          required={mode === 'create'}
        >
          <Input
            type="password"
            autoComplete={mode === 'create' ? 'new-password' : 'off'}
            placeholder={mode === 'create' ? 'Mínimo 6 caracteres' : 'Dejar vacío para no cambiar'}
            {...register('password', {
              required: mode === 'create' ? 'La contraseña es obligatoria' : false,
              minLength: {
                value: 6,
                message: 'Mínimo 6 caracteres',
              },
              validate: (value) => {
                if (mode === 'edit' && !value) return true
                if (value && value.length < 6) return 'Mínimo 6 caracteres'
                return true
              },
            })}
          />
        </FormField>
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
        <FormField label="Estado" required>
          <Select {...register('status')}>
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
            <option value="Bloqueado">Bloqueado</option>
          </Select>
        </FormField>
        {mode === 'create' && (
          <p className="text-xs text-slate-500">
            Roles disponibles en Postgres tras el seed: Administrador y Técnico de Campo.
            Con el email y la contraseña podrá iniciar sesión de inmediato.
          </p>
        )}
      </form>
    </Modal>
  )
}
