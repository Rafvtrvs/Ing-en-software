import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Plus, Trash2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useInventoryStore } from '@/store/useInventoryStore'
import type { KitProductLine, KitStatus, ProductKit } from '@/types'

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
  const syncProductsFromApi = useInventoryStore((s) => s.syncProductsFromApi)
  const addToast = useInventoryStore((s) => s.addToast)

  const [lines, setLines] = useState<KitProductLine[]>([])
  const [pickProductId, setPickProductId] = useState('')
  const [pickQty, setPickQty] = useState(1)
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<KitFormValues>({
    defaultValues: { name: '', description: '', status: 'Activo' },
  })

  useEffect(() => {
    if (!open) return
    void syncProductsFromApi()
  }, [open, syncProductsFromApi])

  useEffect(() => {
    if (!open) return
    setFormError(null)
    setPickQty(1)
    if (mode === 'edit' && kit) {
      reset({
        name: kit.name,
        description: kit.description,
        status: kit.status,
      })
      setLines(kit.items.map((i) => ({ ...i })))
    } else {
      reset({ name: '', description: '', status: 'Activo' })
      setLines([])
    }
  }, [open, mode, kit, reset])

  const availableProducts = useMemo(() => {
    const used = new Set(lines.map((l) => l.productId))
    return products.filter((p) => !used.has(p.id))
  }, [products, lines])

  useEffect(() => {
    if (!open) return
    if (!pickProductId || !availableProducts.some((p) => p.id === pickProductId)) {
      setPickProductId(availableProducts[0]?.id ?? '')
    }
  }, [open, availableProducts, pickProductId])

  const addLine = () => {
    const product = products.find((p) => p.id === pickProductId)
    if (!product) {
      setFormError('Selecciona un producto del inventario')
      return
    }
    if (lines.some((l) => l.productId === product.id)) {
      setFormError('Ese producto ya está en el kit')
      return
    }
    const qty = Math.max(1, Math.floor(Number(pickQty) || 1))
    setLines((prev) => [
      ...prev,
      {
        productId: product.id,
        productName: product.name,
        productCode: product.code,
        quantity: qty,
        unit: product.unit,
      },
    ])
    setPickQty(1)
    setFormError(null)
    const remaining = products.filter(
      (p) => p.id !== product.id && !lines.some((l) => l.productId === p.id),
    )
    setPickProductId(remaining[0]?.id ?? '')
  }

  const updateQty = (productId: string, quantity: number) => {
    const qty = Math.max(1, Math.floor(quantity || 1))
    setLines((prev) =>
      prev.map((l) => (l.productId === productId ? { ...l, quantity: qty } : l)),
    )
  }

  const removeLine = (productId: string) => {
    setLines((prev) => prev.filter((l) => l.productId !== productId))
  }

  const onSubmit = async (data: KitFormValues) => {
    if (lines.length === 0) {
      setFormError('Agrega al menos un producto al kit')
      return
    }

    const payload = {
      name: data.name.trim(),
      description: data.description.trim(),
      status: data.status,
      items: lines,
    }

    if (mode === 'create') {
      const result = await addKit(payload)
      if (!result.ok) {
        setFormError(result.message ?? 'No se pudo crear el kit')
        addToast(result.message ?? 'No se pudo crear el kit', 'error')
        return
      }
      addToast(`Kit "${payload.name}" creado`)
    } else if (kit) {
      const result = await updateKit(kit.id, payload)
      if (!result.ok) {
        setFormError(result.message ?? 'No se pudo actualizar el kit')
        addToast(result.message ?? 'No se pudo actualizar el kit', 'error')
        return
      }
      addToast(`Kit "${payload.name}" actualizado`)
    }
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === 'create' ? 'Nuevo Kit / Paquete' : 'Editar Kit'}
      description="Agrupa productos registrados del inventario en un paquete reutilizable."
      size="lg"
      footer={
        <>
          <Button variant="outline" type="button" onClick={onClose}>
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
          <Input
            {...register('name', { required: true })}
            placeholder="Kit Desobstrucción"
          />
        </FormField>
        <FormField label="Descripción">
          <Input {...register('description')} placeholder="Uso o contenido del kit" />
        </FormField>
        <FormField label="Estado">
          <Select {...register('status')}>
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
          </Select>
        </FormField>

        <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/60 p-4">
          <div>
            <p className="text-sm font-semibold text-slate-800">Productos del kit</p>
            <p className="text-xs text-slate-500">
              Selecciona productos ya registrados en inventario y define cantidades.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-[1fr_96px_auto]">
            <Select
              value={pickProductId}
              onChange={(e) => setPickProductId(e.target.value)}
              disabled={availableProducts.length === 0}
            >
              {availableProducts.length === 0 ? (
                <option value="">Sin productos disponibles</option>
              ) : (
                availableProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} — {p.name}
                  </option>
                ))
              )}
            </Select>
            <Input
              type="number"
              min={1}
              value={pickQty}
              onChange={(e) => setPickQty(Number(e.target.value))}
              aria-label="Cantidad"
            />
            <Button
              type="button"
              variant="outline"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={addLine}
              disabled={availableProducts.length === 0}
            >
              Agregar
            </Button>
          </div>

          {lines.length === 0 ? (
            <p className="py-3 text-center text-sm text-slate-500">
              Aún no hay productos en este kit.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200 bg-white">
              {lines.map((line) => (
                <li
                  key={line.productId}
                  className="flex flex-wrap items-center gap-3 px-3 py-2.5 text-sm"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-900">{line.productName}</p>
                    <p className="text-xs text-slate-500">
                      {line.productCode ? `${line.productCode} · ` : ''}
                      {line.unit}
                    </p>
                  </div>
                  <Input
                    type="number"
                    min={1}
                    className="w-20"
                    value={line.quantity}
                    onChange={(e) =>
                      updateQty(line.productId, Number(e.target.value))
                    }
                    aria-label={`Cantidad de ${line.productName}`}
                  />
                  <button
                    type="button"
                    onClick={() => removeLine(line.productId)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    aria-label={`Quitar ${line.productName}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
      </form>
    </Modal>
  )
}
