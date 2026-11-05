import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { FormGrid } from '@/components/ui/FormGrid'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useInventoryStore } from '@/store/useInventoryStore'
import { useEquipmentStore } from '@/store/useEquipmentStore'
import { findDuplicateProductCode } from '@/features/inventory/utils/productDuplicates'
import { nextProductCode } from '@/features/inventory/utils/productCode'
import {
  isMachineryCategory,
  isVehicleCategory,
  toMachineryCategoryLabel,
} from '@/features/inventory/utils/machineryCategory'
import type { EquipmentStatus, Product } from '@/types'

interface ProductFormValues {
  code: string
  name: string
  category: string
  currentStock: number
  minStock: number
  unit: string
  unitCost: number
  patente: string
  marca: string
  serialNumber: string
  purchaseDate: string
  location: string
  equipmentStatus: EquipmentStatus
  lastMaintenance: string
  nextMaintenance: string
  assignedTo: string
}

interface ProductFormModalProps {
  mode: 'create' | 'edit'
  product?: Product | null
  open: boolean
  onClose: () => void
}

const EQUIPMENT_STATUSES: EquipmentStatus[] = [
  'Operativo',
  'Asignado',
  'Mantenimiento',
  'Fuera de servicio',
]

const emptyEquipmentDefaults = {
  patente: '',
  marca: '',
  serialNumber: '',
  purchaseDate: '',
  location: '',
  equipmentStatus: 'Operativo' as EquipmentStatus,
  lastMaintenance: '',
  nextMaintenance: '',
  assignedTo: '',
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
  const products = useInventoryStore((s) => s.products)
  const categories = useInventoryStore((s) => s.categories)
  const addEquipment = useEquipmentStore((s) => s.addEquipment)
  const syncEquipment = useEquipmentStore((s) => s.syncFromApi)
  const equipment = useEquipmentStore((s) => s.equipment)
  const categoryNames = useMemo(
    () => categories.filter((c) => c.status === 'Activa').map((c) => c.name),
    [categories],
  )

  const {
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    defaultValues: {
      code: '',
      name: '',
      category: categoryNames[0] ?? 'Insumos',
      currentStock: 0,
      minStock: 0,
      unit: 'un',
      unitCost: 0,
      ...emptyEquipmentDefaults,
    },
  })

  const category = watch('category')
  const showMachineryFields = isMachineryCategory(category)
  const showVehicleFields = isVehicleCategory(category)

  const autoCode = useMemo(
    () => nextProductCode(products, category || categoryNames[0] || 'Insumos'),
    [products, category, categoryNames],
  )

  useEffect(() => {
    if (!open) return
    if (mode === 'edit' && product) {
      const linked = equipment.find(
        (e) => e.code.trim().toUpperCase() === product.code.trim().toUpperCase(),
      )
      reset({
        code: product.code,
        name: product.name,
        category: product.category,
        currentStock: product.currentStock,
        minStock: product.minStock,
        unit: product.unit,
        unitCost: product.unitCost ?? 0,
        patente: linked?.patente ?? '',
        marca: linked?.marca ?? '',
        serialNumber:
          linked?.serialNumber && linked.serialNumber !== '—'
            ? linked.serialNumber
            : '',
        purchaseDate: linked?.purchaseDate ?? '',
        location:
          linked?.location && linked.location !== '—' ? linked.location : '',
        equipmentStatus: linked?.status ?? 'Operativo',
        lastMaintenance: linked?.lastMaintenance ?? '',
        nextMaintenance: linked?.nextMaintenance ?? '',
        assignedTo: linked?.assignedTo ?? '',
      })
    } else {
      const initialCategory = categoryNames[0] ?? 'Insumos'
      const isMach = isMachineryCategory(initialCategory)
      reset({
        code: nextProductCode(products, initialCategory),
        name: '',
        category: initialCategory,
        currentStock: isMach ? 1 : 0,
        minStock: isMach ? 1 : 0,
        unit: 'un',
        unitCost: 0,
        ...emptyEquipmentDefaults,
      })
    }
  }, [open, mode, product, reset, categoryNames, products, equipment])

  useEffect(() => {
    if (!open || mode !== 'create') return
    setValue('code', autoCode)
  }, [autoCode, open, mode, setValue])

  useEffect(() => {
    if (!open || mode !== 'create' || !showMachineryFields) return
    setValue('currentStock', 1)
    setValue('minStock', 1)
    setValue('unit', 'un')
  }, [showMachineryFields, open, mode, setValue])

  const onSubmit = async (data: ProductFormValues) => {
    const code =
      mode === 'create'
        ? nextProductCode(products, data.category)
        : data.code.trim()

    const payload = {
      code,
      name: data.name.trim(),
      category: data.category,
      currentStock: Number(data.currentStock),
      minStock: Number(data.minStock),
      unit: data.unit,
      unitCost: Math.max(0, Number(data.unitCost) || 0),
    }

    const duplicate = findDuplicateProductCode(
      products,
      payload.code,
      mode === 'edit' ? product?.id : undefined,
    )
    if (duplicate) {
      setError('code', { type: 'validate', message: duplicate.message })
      return
    }

    if (isVehicleCategory(data.category) && !data.patente.trim()) {
      setError('patente', {
        type: 'validate',
        message: 'La patente es obligatoria para vehículos',
      })
      return
    }

    if (mode === 'create') {
      const result = await addProduct(payload)
      if (!result.ok) {
        if (result.field && result.message) {
          setError(result.field, { type: 'validate', message: result.message })
        }
        return
      }

      if (isMachineryCategory(data.category)) {
        // El backend ya crea la maquinaria al crear el activo; reforzamos con upsert
        // por si el alta fue solo local o faltan campos de flota.
        const eqResult = await addEquipment({
          code: payload.code,
          name: payload.name,
          category: toMachineryCategoryLabel(data.category),
          status: data.equipmentStatus,
          serialNumber: data.serialNumber.trim(),
          location:
            data.location.trim() ||
            (data.patente.trim()
              ? `Patente ${data.patente.trim().toUpperCase()}`
              : 'Sin ubicación'),
          assignedTo: data.assignedTo.trim() || undefined,
          lastMaintenance: data.lastMaintenance,
          nextMaintenance: data.nextMaintenance,
          patente: data.patente.trim()
            ? data.patente.trim().toUpperCase()
            : undefined,
          marca: data.marca.trim() || undefined,
          purchaseDate: data.purchaseDate || undefined,
        })
        if (!eqResult.ok) {
          addToast(
            eqResult.message ??
              'Producto creado, pero no se pudo completar disponibilidad de maquinaria',
            'error',
          )
        }
        await syncEquipment()
      }

      addToast(`Producto ${payload.code} "${data.name}" creado correctamente`)
    } else if (product) {
      const result = await updateProduct(product.id, payload)
      if (!result.ok) {
        if (result.field && result.message) {
          setError(result.field, { type: 'validate', message: result.message })
        }
        return
      }
      addToast(`Producto "${data.name}" actualizado correctamente`)
    }
    onClose()
  }

  const namePlaceholder = showVehicleFields
    ? 'Ej: Camión hidrojet 3000 PSI'
    : showMachineryFields
      ? 'Ej: Bomba sumergible 3HP'
      : 'Ej: Tubería PVC 110mm'

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === 'create' ? 'Nuevo Producto' : 'Editar Producto'}
      description={
        showMachineryFields
          ? 'Se registrará también en disponibilidad de maquinaria.'
          : 'Registra o actualiza la información del producto en inventario.'
      }
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
        <FormGrid cols={2}>
          <FormField label="Código" htmlFor="code" error={errors.code?.message} required>
            <Input
              id="code"
              readOnly
              value={mode === 'edit' && product ? product.code : autoCode}
              className="bg-slate-50 text-slate-700"
            />
            {mode === 'create' ? (
              <p className="mt-1 text-xs text-slate-500">
                Lo asigna el sistema según la categoría (ej. BOM-001, CAM-001).
              </p>
            ) : null}
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
        </FormGrid>

        <FormField label="Nombre del producto" htmlFor="name" error={errors.name?.message} required>
          <Input
            id="name"
            placeholder={namePlaceholder}
            {...register('name', { required: 'El nombre es obligatorio' })}
            className={errors.name ? 'border-red-300' : undefined}
          />
        </FormField>

        {showMachineryFields ? (
          <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50/60 p-4">
            <div>
              <p className="text-sm font-semibold text-slate-800">
                Datos de maquinaria
              </p>
              <p className="text-xs text-slate-500">
                Este ítem aparecerá en Disponibilidad de maquinaria
                {showVehicleFields ? ' (flota / vehículos).' : '.'}
              </p>
            </div>

            {showVehicleFields ? (
              <FormGrid cols={2}>
                <FormField
                  label="Patente"
                  htmlFor="patente"
                  error={errors.patente?.message}
                  required
                >
                  <Input
                    id="patente"
                    placeholder="Ej: ABCD-12"
                    {...register('patente', {
                      validate: (v) =>
                        !showVehicleFields || v.trim()
                          ? true
                          : 'La patente es obligatoria para vehículos',
                    })}
                    className={errors.patente ? 'border-red-300' : undefined}
                  />
                </FormField>
                <FormField label="Marca" htmlFor="marca">
                  <Input id="marca" placeholder="Ej: Isuzu" {...register('marca')} />
                </FormField>
              </FormGrid>
            ) : (
              <FormField label="Marca" htmlFor="marca">
                <Input
                  id="marca"
                  placeholder="Ej: Grundfos, Caterpillar..."
                  {...register('marca')}
                />
              </FormField>
            )}

            <FormGrid cols={2}>
              <FormField label="Nº de serie" htmlFor="serialNumber">
                <Input
                  id="serialNumber"
                  placeholder="Ej: BS-2024-00891"
                  {...register('serialNumber')}
                />
              </FormField>
              <FormField label="Fecha de compra" htmlFor="purchaseDate">
                <Input id="purchaseDate" type="date" {...register('purchaseDate')} />
              </FormField>
            </FormGrid>

            <FormGrid cols={2}>
              <FormField label="Ubicación" htmlFor="location">
                <Input
                  id="location"
                  placeholder="Ej: Bodega Central — Santiago"
                  {...register('location')}
                />
              </FormField>
              <FormField label="Estado operativo" htmlFor="equipmentStatus">
                <Select id="equipmentStatus" {...register('equipmentStatus')}>
                  {EQUIPMENT_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </FormField>
            </FormGrid>

            <FormGrid cols={3}>
              <FormField label="Última mantención" htmlFor="lastMaintenance">
                <Input id="lastMaintenance" type="date" {...register('lastMaintenance')} />
              </FormField>
              <FormField label="Próxima mantención" htmlFor="nextMaintenance">
                <Input id="nextMaintenance" type="date" {...register('nextMaintenance')} />
              </FormField>
              <FormField label="Asignado a" htmlFor="assignedTo">
                <Input
                  id="assignedTo"
                  placeholder="Ej: Unidad móvil 01"
                  {...register('assignedTo')}
                />
              </FormField>
            </FormGrid>
          </div>
        ) : null}

        <FormGrid cols={3}>
          <FormField
            label={showMachineryFields ? 'Cantidad (unidades)' : 'Stock actual'}
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
        </FormGrid>

        {!showMachineryFields ? (
          <FormField
            label="Costo unitario (CLP)"
            htmlFor="unitCost"
            error={errors.unitCost?.message}
            required
          >
            <Input
              id="unitCost"
              type="number"
              min={0}
              step={1}
              placeholder="Ej: 2500"
              {...register('unitCost', {
                required: 'Ingrese el costo del material',
                valueAsNumber: true,
                min: { value: 0, message: 'El costo no puede ser negativo' },
              })}
              className={errors.unitCost ? 'border-red-300' : undefined}
            />
            <p className="mt-1 text-xs text-slate-500">
              Se usa para calcular el costo de materiales y la utilidad del periodo.
            </p>
          </FormField>
        ) : null}
      </form>
    </Modal>
  )
}
