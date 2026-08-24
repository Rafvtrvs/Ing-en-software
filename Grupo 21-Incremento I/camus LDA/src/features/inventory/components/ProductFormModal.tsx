import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useInventoryStore } from '@/store/useInventoryStore'
import type { Product } from '@/types'

interface ProductFormValues {
  code: string
  name: string
  category: string
  currentStock: number
  minStock: number
  unit: string
}

interface ProductFormModalProps {
  mode: 'create' | 'edit'
  product?: Product | null
  open: boolean
  onClose: () => void
}

export function ProductFormModal({
  mode,
  product,
  open,
  onClose,
}: ProductFormModalProps) {
  const addProduct = useInventoryStore((s) => s.addProduct)
  const updateProduct = useInventoryStore((s) => s.updateProduct)
  const addToast = useInventoryStore((s) => s.addToast)
  // Seleccionar el array estable y derivar con useMemo: un selector que
  // retorna un array nuevo en cada llamada provoca re-renders infinitos.
  const categories = useInventoryStore((s) => s.categories)
  const categoryNames = useMemo(
    () => categories.filter((c) => c.status === 'Activa').map((c) => c.name),
    [categories],
  )

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    defaultValues: {
      code: '',
      name: '',
      category: 'Tuberías',
      currentStock: 0,
      minStock: 0,
      unit: 'un',
    },
  })

  useEffect(() => {
    if (!open) return
    if (mode === 'edit' && product) {
      reset({
        code: product.code,
        name: product.name,
        category: product.category,
        currentStock: product.currentStock,
        minStock: product.minStock,
        unit: product.unit,
      })
    } else {
      reset({
        code: '',
        name: '',
        category: 'Tuberías',
        currentStock: 0,
        minStock: 0,
        unit: 'un',
      })
    }
  }, [open, mode, product, reset])

  const onSubmit = (data: ProductFormValues) => {
    const payload = {
      ...data,
      currentStock: Number(data.currentStock),
      minStock: Number(data.minStock),
    }

    if (mode === 'create') {
      addProduct(payload)
      addToast(`Producto "${data.name}" creado correctamente`)
    } else if (product) {
      updateProduct(product.id, payload)
      addToast(`Producto "${data.name}" actualizado correctamente`)
    }
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === 'create' ? 'Nuevo Producto' : 'Editar Producto'}
      description="Registra o actualiza la información del producto en inventario."
      size="lg"
      footer={
        <>
          <Button variant="outline" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="product-form" disabled={isSubmitting}>
            {mode === 'create' ? 'Crear Producto' : 'Guardar Cambios'}
          </Button>
        </>
      }
    >
      <form id="product-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Código" htmlFor="code" error={errors.code?.message} required>
            <Input
              id="code"
              placeholder="Ej: PVC-110-001"
              {...register('code', { required: 'El código es obligatorio' })}
              className={errors.code ? 'border-red-300' : undefined}
            />
          </FormField>
          <FormField label="Categoría" htmlFor="category" required>
            <Select id="category" {...register('category')}>
              {categoryNames.length === 0 ? (
                <option value="">Sin categorías activas</option>
              ) : (
                categoryNames.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))
              )}
            </Select>
          </FormField>
        </div>

        <FormField label="Nombre del producto" htmlFor="name" error={errors.name?.message} required>
          <Input
            id="name"
            placeholder="Ej: Tubería PVC 110mm"
            {...register('name', { required: 'El nombre es obligatorio' })}
            className={errors.name ? 'border-red-300' : undefined}
          />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-3">
          <FormField
            label="Stock actual"
            htmlFor="currentStock"
            error={errors.currentStock?.message}
            required
          >
            <Input
              id="currentStock"
              type="number"
              min={0}
              {...register('currentStock', {
                required: true,
                valueAsNumber: true,
                min: { value: 0, message: 'Mínimo 0' },
              })}
            />
          </FormField>
          <FormField
            label="Stock mínimo"
            htmlFor="minStock"
            error={errors.minStock?.message}
            required
          >
            <Input
              id="minStock"
              type="number"
              min={0}
              {...register('minStock', {
                required: true,
                valueAsNumber: true,
                min: { value: 0, message: 'Mínimo 0' },
              })}
            />
          </FormField>
          <FormField label="Unidad" htmlFor="unit" required>
            <Select id="unit" {...register('unit')}>
              <option value="un">un</option>
              <option value="m">m</option>
              <option value="kg">kg</option>
              <option value="lt">lt</option>
            </Select>
          </FormField>
        </div>
      </form>
    </Modal>
  )
}
