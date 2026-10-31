import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { ImagePlus, Trash2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useUsersStore } from '@/store/useUsersStore'
import { UserAvatar } from '@/components/layout/UserAvatar'
import { AvatarCropModal } from '@/features/settings/components/AvatarCropModal'
import { authService } from '@/services/authService'
import { applySessionUser } from '@/features/auth/sessionAvatar'
import type { SystemUser, SystemUserStatus } from '@/types'

function syncSessionIfSelf(updated: SystemUser) {
  const session = authService.getUser()
  if (!session || session.id !== updated.id) return
  const token = localStorage.getItem('auth_token')
  if (token) {
    localStorage.setItem(
      'auth_user',
      JSON.stringify({
        ...session,
        name: updated.name,
        email: updated.email,
        phone: updated.phone,
        avatar: updated.avatar || '',
      }),
    )
  }
  applySessionUser({
    name: updated.name,
    role: session.role,
    email: updated.email,
    phone: updated.phone,
    avatar: updated.avatar || '',
  })
}

const MAX_BYTES = 5 * 1024 * 1024

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

function isAllowedImage(file: File): boolean {
  const type = file.type.toLowerCase()
  const name = file.name.toLowerCase()
  return (
    type === 'image/png' ||
    type === 'image/jpeg' ||
    type === 'image/jpg' ||
    name.endsWith('.png') ||
    name.endsWith('.jpg') ||
    name.endsWith('.jpeg')
  )
}

function readImageAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result)
      else reject(new Error('No se pudo leer la imagen'))
    }
    reader.onerror = () => reject(new Error('Error al leer el archivo'))
    reader.readAsDataURL(file)
  })
}

/** Mismo layout vertical que el formulario de OT en terreno (operador). */
export function UserFormModal({ mode, user, open, onClose }: UserFormModalProps) {
  const roles = useUsersStore((s) => s.roles)
  const createUserInDb = useUsersStore((s) => s.createUserInDb)
  const updateUserInDb = useUsersStore((s) => s.updateUserInDb)
  const updateUser = useUsersStore((s) => s.updateUser)
  const addToast = useUsersStore((s) => s.addToast)
  const fileRef = useRef<HTMLInputElement>(null)
  const [avatar, setAvatar] = useState('')
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [busyPhoto, setBusyPhoto] = useState(false)

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
      setAvatar(user.avatar?.startsWith('data:') || user.avatar?.startsWith('http')
        ? user.avatar
        : '')
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
    setAvatar('')
  }, [open, mode, user, reset, defaultRoleId])

  const handlePickPhoto = async (file: File | null) => {
    if (!file) return
    if (!isAllowedImage(file)) {
      addToast('Solo se permiten imágenes PNG o JPG', 'error')
      return
    }
    if (file.size > MAX_BYTES) {
      addToast('La imagen no puede superar 5 MB', 'error')
      return
    }
    setBusyPhoto(true)
    try {
      setCropSrc(await readImageAsDataUrl(file))
    } catch {
      addToast('No se pudo cargar la imagen', 'error')
    } finally {
      setBusyPhoto(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

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
        ...(avatar ? { avatar } : null),
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
          avatar,
          ...(data.password ? { password: data.password } : {}),
        })
        if (result.ok) {
          syncSessionIfSelf(result.user)
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
        avatar,
      })
      addToast(`Usuario "${data.name}" actualizado localmente`)
      onClose()
    }
  }

  return (
    <>
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
          <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-100 bg-slate-50/60 p-3 dark:border-slate-700 dark:bg-slate-900/40">
            <UserAvatar size="lg" src={avatar || null} alt={user?.name ?? 'Nuevo usuario'} />
            <div className="min-w-0 space-y-2">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Foto de perfil (PNG/JPG, máx. 5 MB)
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  leftIcon={<ImagePlus className="h-4 w-4" />}
                  disabled={busyPhoto}
                  onClick={() => fileRef.current?.click()}
                >
                  {busyPhoto ? 'Cargando…' : 'Subir foto'}
                </Button>
                {avatar ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    leftIcon={<Trash2 className="h-4 w-4" />}
                    onClick={() => setAvatar('')}
                  >
                    Quitar
                  </Button>
                ) : null}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,.png,.jpg,.jpeg"
                className="hidden"
                onChange={(e) => void handlePickPhoto(e.target.files?.[0] ?? null)}
              />
            </div>
          </div>

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

      <AvatarCropModal
        open={Boolean(cropSrc)}
        imageSrc={cropSrc}
        onClose={() => setCropSrc(null)}
        onConfirm={(url) => {
          setAvatar(url)
          setCropSrc(null)
        }}
      />
    </>
  )
}
