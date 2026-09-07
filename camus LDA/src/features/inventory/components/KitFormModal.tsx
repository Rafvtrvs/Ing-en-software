import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useInventoryStore } from '@/store/useInventoryStore'
import type { KitStatus, ProductKit } from '@/types'

interface KitFormValues {
  name: string
  description: string
  status: KitStatus
}

interface KitFormModalProps {
  mode: 'create' | 'edit'
  kit?: ProductKit | null
  open: boolean
  onClose: () => void
}

export function KitFormModal({ mode, kit, open, onClose }: KitFormModalProps) {
  const addKit = useInventoryStore((s) => s.addKit)
  const updateKit = useInventoryStore((s) => s.updateKit)
  const products = useInventoryStore((s) => s.products)
  const addToast = useInventoryStore((s) => s.addToast)

  const { register, handleSubmit, reset, formState: { isSubmitting } } =
    useForm<KitFormValues>({
      defaultValues: { name: '', description: '', status: 'Activo' },
    })

  useEffect(() => {
    if (!open) return
    if (mode === 'edit' && kit) {
      reset({ name: kit.name, description: kit.description, status: kit.status })
    } else {
      reset({ name: '', description: '', status: 'Activo' })
    }
  }, [open, mode, kit, reset])

  const onSubmit = (data: KitFormValues) => {
    if (mode === 'create') {
      const first = products[0]
      addKit({
        ...data,
        items: first
          ? [
              {
                productId: first.id,
                productName: first.name,
                quantity: 1,
                unit: first.unit,
              },
            ]
          : [],
      })
      addToast(`Kit "${data.name}" creado`)
    } else if (kit) {
      updateKit(kit.id, data)
      addToast(`Kit "${data.name}" actualizado`)
    }
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === 'create' ? 'Nuevo Kit' : 'Editar Kit'}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="kit-form" disabled={isSubmitting}>
            {mode === 'create' ? 'Crear Kit' : 'Guardar'}
          </Button>
        </>
      }
    >
      <form id="kit-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField label="Nombre del kit" required>
          <Input {...register('name', { required: true })} placeholder="Kit Desobstrucción" />
        </FormField>
        <FormField label="Descripción">
          <Input {...register('description')} placeholder="Descripción del kit" />
        </FormField>
        <FormField label="Estado">
          <Select {...register('status')}>
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
          </Select>
        </FormField>
        {mode === 'create' && products[0] && (
          <p className="text-xs text-slate-500">
            Se incluirá un producto inicial; podrás ampliar el kit en una próxima versión.
          </p>
        )}
      </form>
    </Modal>
  )
}
