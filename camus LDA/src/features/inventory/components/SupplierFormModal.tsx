import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useInventoryStore } from '@/store/useInventoryStore'
import type { Supplier, SupplierStatus } from '@/types'

interface SupplierFormValues {
  name: string
  rut: string
  contact: string
  phone: string
  email: string
  address: string
  paymentTerms: string
  status: SupplierStatus
}

interface SupplierFormModalProps {
  mode: 'create' | 'edit'
  supplier?: Supplier | null
  open: boolean
  onClose: () => void
}

export function SupplierFormModal({
  mode,
  supplier,
  open,
  onClose,
}: SupplierFormModalProps) {
  const addSupplier = useInventoryStore((s) => s.addSupplier)
  const updateSupplier = useInventoryStore((s) => s.updateSupplier)
  const addToast = useInventoryStore((s) => s.addToast)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SupplierFormValues>({
    defaultValues: {
      name: '',
      rut: '',
      contact: '',
      phone: '',
      email: '',
      address: '',
      paymentTerms: '30 días',
      status: 'Activo',
    },
  })

  useEffect(() => {
    if (!open) return
    if (mode === 'edit' && supplier) {
      reset({
        name: supplier.name,
        rut: supplier.rut,
        contact: supplier.contact,
        phone: supplier.phone,
        email: supplier.email,
        address: supplier.address,
        paymentTerms: supplier.paymentTerms,
        status: supplier.status,
      })
    } else {
      reset({
        name: '',
        rut: '',
        contact: '',
        phone: '',
        email: '',
        address: '',
        paymentTerms: '30 días',
        status: 'Activo',
      })
    }
  }, [open, mode, supplier, reset])

  const onSubmit = (data: SupplierFormValues) => {
    if (mode === 'create') {
      addSupplier(data)
      addToast(`Proveedor "${data.name}" registrado`)
    } else if (supplier) {
      updateSupplier(supplier.id, data)
      addToast(`Proveedor "${data.name}" actualizado`)
    }
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === 'create' ? 'Nuevo Proveedor' : 'Editar Proveedor'}
      description="Datos de contacto y condiciones comerciales."
      size="lg"
      footer={
        <>
          <Button variant="outline" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="supplier-form" disabled={isSubmitting}>
            {mode === 'create' ? 'Registrar Proveedor' : 'Guardar Cambios'}
          </Button>
        </>
      }
    >
      <form id="supplier-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Razón social" htmlFor="sup-name" error={errors.name?.message} required>
            <Input
              id="sup-name"
              {...register('name', { required: 'Obligatorio' })}
            />
          </FormField>
          <FormField label="RUT" htmlFor="sup-rut" error={errors.rut?.message} required>
            <Input
              id="sup-rut"
              placeholder="76.123.456-7"
              {...register('rut', { required: 'Obligatorio' })}
            />
          </FormField>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Contacto" htmlFor="sup-contact" required>
            <Input id="sup-contact" {...register('contact', { required: true })} />
          </FormField>
          <FormField label="Teléfono" htmlFor="sup-phone" required>
            <Input id="sup-phone" {...register('phone', { required: true })} />
          </FormField>
        </div>
        <FormField label="Email" htmlFor="sup-email" required>
          <Input
            id="sup-email"
            type="email"
            {...register('email', {
              required: 'Obligatorio',
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email inválido' },
            })}
          />
        </FormField>
        <FormField label="Dirección" htmlFor="sup-address">
          <Input id="sup-address" {...register('address')} />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Condiciones de pago" htmlFor="sup-terms">
            <Input id="sup-terms" placeholder="30 días" {...register('paymentTerms')} />
          </FormField>
          <FormField label="Estado" htmlFor="sup-status">
            <Select id="sup-status" {...register('status')}>
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
            </Select>
          </FormField>
        </div>
      </form>
    </Modal>
  )
}
