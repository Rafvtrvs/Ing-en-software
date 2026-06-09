import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useInventoryStore } from '@/store/useInventoryStore'
import type { CategoryStatus, ProductCategory } from '@/types'

interface CategoryFormValues {
  name: string
  description: string
  status: CategoryStatus
}

interface CategoryFormModalProps {
  mode: 'create' | 'edit'
  category?: ProductCategory | null
  open: boolean
  onClose: () => void
}

export function CategoryFormModal({
  mode,
  category,
  open,
  onClose,
}: CategoryFormModalProps) {
  const addCategory = useInventoryStore((s) => s.addCategory)
  const updateCategory = useInventoryStore((s) => s.updateCategory)
  const addToast = useInventoryStore((s) => s.addToast)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormValues>({
    defaultValues: { name: '', description: '', status: 'Activa' },
  })

  useEffect(() => {
    if (!open) return
    if (mode === 'edit' && category) {
      reset({
        name: category.name,
        description: category.description,
        status: category.status,
      })
    } else {
      reset({ name: '', description: '', status: 'Activa' })
    }
  }, [open, mode, category, reset])

  const onSubmit = (data: CategoryFormValues) => {
    if (mode === 'create') {
      addCategory(data)
      addToast(`Categoría "${data.name}" creada`)
    } else if (category) {
      updateCategory(category.id, data)
      addToast(`Categoría "${data.name}" actualizada`)
    }
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === 'create' ? 'Nueva Categoría' : 'Editar Categoría'}
      description="Organiza los productos del inventario por categorías."
      footer={
        <>
          <Button variant="outline" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="category-form" disabled={isSubmitting}>
            {mode === 'create' ? 'Crear Categoría' : 'Guardar Cambios'}
          </Button>
        </>
      }
    >
      <form id="category-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField label="Nombre" htmlFor="cat-name" error={errors.name?.message} required>
          <Input
            id="cat-name"
            placeholder="Ej: Tuberías"
            {...register('name', { required: 'El nombre es obligatorio' })}
          />
        </FormField>
        <FormField label="Descripción" htmlFor="cat-desc">
          <Input
            id="cat-desc"
            placeholder="Breve descripción de la categoría"
            {...register('description')}
          />
        </FormField>
        <FormField label="Estado" htmlFor="cat-status" required>
          <Select id="cat-status" {...register('status')}>
            <option value="Activa">Activa</option>
            <option value="Inactiva">Inactiva</option>
          </Select>
        </FormField>
      </form>
    </Modal>
  )
}
