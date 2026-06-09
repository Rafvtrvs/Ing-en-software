import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useUsersStore } from '@/store/useUsersStore'
import { PermissionsEditor } from './PermissionsEditor'
import type { AppRole, PermissionKey } from '@/types'

interface RoleFormValues {
  name: string
  description: string
  status: 'Activo' | 'Inactivo'
}

interface RoleFormModalProps {
  mode: 'create' | 'edit'
  role?: AppRole | null
  open: boolean
  onClose: () => void
}

export function RoleFormModal({ mode, role, open, onClose }: RoleFormModalProps) {
  const addRole = useUsersStore((s) => s.addRole)
  const updateRole = useUsersStore((s) => s.updateRole)
  const addToast = useUsersStore((s) => s.addToast)

  const [permissions, setPermissions] = useState<PermissionKey[]>(['dashboard.view'])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RoleFormValues>({
    defaultValues: { name: '', description: '', status: 'Activo' },
  })

  useEffect(() => {
    if (!open) return
    if (mode === 'edit' && role) {
      reset({
        name: role.name,
        description: role.description,
        status: role.status,
      })
      setPermissions(role.permissions)
    } else {
      reset({ name: '', description: '', status: 'Activo' })
      setPermissions(['dashboard.view'])
    }
  }, [open, mode, role, reset])

  const onSubmit = (data: RoleFormValues) => {
    if (permissions.length === 0) {
      addToast('Selecciona al menos un permiso', 'error')
      return
    }

    if (mode === 'create') {
      addRole({ ...data, permissions })
      addToast(`Rol "${data.name}" creado correctamente`)
    } else if (role) {
      updateRole(role.id, { ...data, permissions })
      addToast(`Rol "${data.name}" actualizado correctamente`)
    }
    onClose()
  }

  const isSystemRole = mode === 'edit' && role?.isSystem

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === 'create' ? 'Nuevo Rol' : 'Editar Rol'}
      description={
        mode === 'create'
          ? 'Define un perfil con permisos personalizados.'
          : 'Modifica el rol y sus permisos de acceso.'
      }
      size="lg"
      footer={
        <>
          <Button variant="outline" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="role-form" disabled={isSubmitting}>
            {mode === 'create' ? 'Crear Rol' : 'Guardar Cambios'}
          </Button>
        </>
      }
    >
      <form id="role-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Nombre del rol" error={errors.name?.message} required>
            <Input
              placeholder="Ej: Coordinador"
              disabled={isSystemRole}
              {...register('name', { required: 'El nombre es obligatorio' })}
            />
          </FormField>
          <FormField label="Estado" required>
            <Select {...register('status')} disabled={isSystemRole}>
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
            </Select>
          </FormField>
        </div>
        <FormField label="Descripción" error={errors.description?.message} required>
          <Input
            placeholder="Describe las responsabilidades de este rol"
            {...register('description', { required: 'La descripción es obligatoria' })}
          />
        </FormField>

        <div>
          <p className="mb-3 text-sm font-semibold text-slate-900">Permisos</p>
          <PermissionsEditor
            value={permissions}
            onChange={setPermissions}
            disabled={false}
          />
        </div>
      </form>
    </Modal>
  )
}
