import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { FormField } from '@/components/ui/FormField'
import { useUsersStore } from '@/store/useUsersStore'
import type { SystemUser } from '@/types'

/** RF70 — CU-241: Editar correo electrónico vinculado a usuario */
export function EditUserEmailModal({
  user,
  open,
  onClose,
}: {
  user: SystemUser | null
  open: boolean
  onClose: () => void
}) {
  const editUserEmail = useUsersStore((s) => s.editUserEmail)
  const addToast = useUsersStore((s) => s.addToast)
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (open && user) {
      setEmail(user.email ?? '')
      setError('')
    }
  }, [open, user])

  if (!user) return null

  const handleSubmit = () => {
    const trimmed = email.trim()
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Ingrese un correo electrónico válido')
      return
    }
    const result = editUserEmail(user.id, trimmed)
    if (!result.ok) {
      addToast(result.message ?? 'No fue posible editar el correo', 'error')
      return
    }
    addToast('Correo electrónico actualizado')
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Editar correo electrónico"
      description={`Usuario: ${user.name}`}
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>Guardar correo</Button>
        </>
      }
    >
      <FormField label="Nuevo correo electrónico" required error={error}>
        <Input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            if (error) setError('')
          }}
          placeholder="usuario@empresa.cl"
        />
      </FormField>
    </Modal>
  )
}
