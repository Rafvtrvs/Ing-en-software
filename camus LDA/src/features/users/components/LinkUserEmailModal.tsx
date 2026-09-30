import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { FormField } from '@/components/ui/FormField'
import { useUsersStore } from '@/store/useUsersStore'
import type { SystemUser } from '@/types'

/** RF70 — CU-239: Vincular correo electrónico a usuario */
export function LinkUserEmailModal({
  user,
  open,
  onClose,
}: {
  user: SystemUser | null
  open: boolean
  onClose: () => void
}) {
  const linkUserEmail = useUsersStore((s) => s.linkUserEmail)
  const addToast = useUsersStore((s) => s.addToast)
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (open && user) {
      setEmail(user.emailLinked === false ? '' : user.email ?? '')
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
    const result = linkUserEmail(user.id, trimmed)
    if (!result.ok) {
      addToast(result.message ?? 'No fue posible vincular el correo', 'error')
      return
    }
    addToast('Vinculación realizada con éxito')
    setEmail('')
    setError('')
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Vincular correo electrónico"
      description={`Usuario: ${user.name}`}
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>Confirmar vinculación</Button>
        </>
      }
    >
      <FormField label="Correo electrónico" required error={error}>
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
