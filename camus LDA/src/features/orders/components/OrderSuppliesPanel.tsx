import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  Package,
  PackagePlus,
  RotateCcw,
  Search,
  Trash2,
  Wrench,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { useOrdersStore } from '@/store/useOrdersStore'
import { useInventoryStore } from '@/store/useInventoryStore'
import { isConsumableStockCategory } from '@/features/inventory/utils/stockCategories'
import type { Product, ProductKit, WorkOrder } from '@/types'

type ValidationState =
  | { status: 'idle' }
  | { status: 'success' }
  | { status: 'error'; failures: SupplyFailure[] }

interface SupplyFailure {
  productId: string
  name: string
  requested: number
  available: number
  unit: string
}

function formatUnitLabel(product: Product): string {
  if (product.name.toLowerCase().includes('cemento')) return 'Saco (25 kg)'
  if (product.unit === 'm') return 'Metro'
  if (product.unit === 'un') return 'Unidad'
  if (product.unit === 'kg') return 'Kilogramo'
  return product.unit
}

function formatStockObservation(product: Product, requested: number): string {
  if (requested <= 0) return '—'
  if (product.currentStock >= requested) {
    return `Stock disponible: ${product.currentStock} ${product.unit}`
  }
  return `Faltan ${requested - product.currentStock} ${product.unit}`
}

/**
 * RF62 — registro, validación de disponibilidad y actualización de stock en OT
 */
export function OrderSuppliesPanel({
  order,
  canEdit,
}: {
  order: WorkOrder
  canEdit: boolean
}) {
  const registerSupplies = useOrdersStore((s) => s.registerSupplies)
  const removeRegisteredSupply = useOrdersStore((s) => s.removeRegisteredSupply)
  const addToast = useOrdersStore((s) => s.addToast)
  const [removingIndex, setRemovingIndex] = useState<number | null>(null)
  const products = useInventoryStore((s) => s.products)
  const kits = useInventoryStore((s) => s.kits)
  const syncProductsFromApi = useInventoryStore((s) => s.syncProductsFromApi)
  const syncKitsFromApi = useInventoryStore((s) => s.syncKitsFromApi)

  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [validation, setValidation] = useState<ValidationState>({ status: 'idle' })
  const [selectedKitId, setSelectedKitId] = useState('')
  const [kitQty, setKitQty] = useState(1)
  const [appliedKits, setAppliedKits] = useState<
    Array<{ kitId: string; kitName: string; quantity: number }>
  >([])

  const syncMovementsFromApi = useInventoryStore((s) => s.syncMovementsFromApi)

  useEffect(() => {
    void Promise.all([
      syncProductsFromApi(),
      syncKitsFromApi(),
      syncMovementsFromApi(),
    ])
  }, [syncProductsFromApi, syncKitsFromApi, syncMovementsFromApi])

  const catalogProducts = useMemo(
    () =>
      products
        .filter((p) => isConsumableStockCategory(p.category))
        .sort((a, b) => {
          if (a.category === 'Insumos' && b.category !== 'Insumos') return -1
          if (b.category === 'Insumos' && a.category !== 'Insumos') return 1
          return a.name.localeCompare(b.name, 'es')
        }),
    [products],
  )

  const activeKits = useMemo(
    () =>
      kits
        .filter((k) => k.status === 'Activo' && k.items.length > 0)
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name, 'es')),
    [kits],
  )

  useEffect(() => {
    if (!selectedKitId && activeKits[0]) {
      setSelectedKitId(activeKits[0].id)
    }
  }, [activeKits, selectedKitId])

  const activeLines = useMemo(() => {
    return catalogProducts
      .map((p) => ({ product: p, quantity: quantities[p.id] ?? 0 }))
      .filter((line) => line.quantity > 0)
  }, [catalogProducts, quantities])

  const setQuantity = (productId: string, raw: number) => {
    const quantity = Math.max(0, raw)
    setQuantities((prev) => ({ ...prev, [productId]: quantity }))
    setValidation({ status: 'idle' })
  }

  const runValidation = (): ValidationState => {
    if (activeLines.length === 0) {
      addToast('Ingrese al menos una cantidad mayor a cero', 'error')
      return { status: 'idle' }
    }

    const failures: SupplyFailure[] = []
    for (const { product, quantity } of activeLines) {
      if (product.currentStock < quantity) {
        failures.push({
          productId: product.id,
          name: product.name,
          requested: quantity,
          available: product.currentStock,
          unit: product.unit,
        })
      }
    }

    if (failures.length > 0) {
      return { status: 'error', failures }
    }
    return { status: 'success' }
  }

  const handleValidate = () => {
    const result = runValidation()
    setValidation(result)
  }

  const handleClear = () => {
    setQuantities({})
    setValidation({ status: 'idle' })
    setAppliedKits([])
    setKitQty(1)
  }

  const applyKitToQuantities = (kit: ProductKit, times: number) => {
    const catalogById = new Map(catalogProducts.map((p) => [p.id, p]))
    const next = { ...quantities }
    let added = 0
    const skipped: string[] = []

    for (const item of kit.items) {
      const product = catalogById.get(item.productId)
      if (!product) {
        skipped.push(item.productName)
        continue
      }
      const add = Math.max(1, item.quantity) * times
      next[product.id] = (next[product.id] ?? 0) + add
      added += 1
    }

    setQuantities(next)
    setValidation({ status: 'idle' })
    setAppliedKits((prev) => {
      const existing = prev.find((p) => p.kitId === kit.id)
      if (existing) {
        return prev.map((p) =>
          p.kitId === kit.id ? { ...p, quantity: p.quantity + times } : p,
        )
      }
      return [...prev, { kitId: kit.id, kitName: kit.name, quantity: times }]
    })

    if (added === 0) {
      addToast(
        'El kit no tiene productos válidos para esta OT (revise categorías/stock)',
        'error',
      )
      return
    }
    if (skipped.length > 0) {
      addToast(
        `Kit aplicado parcialmente. No se agregaron: ${skipped.slice(0, 3).join(', ')}${
          skipped.length > 3 ? '…' : ''
        }`,
        'info',
      )
      return
    }
    addToast(
      times === 1
        ? `Kit "${kit.name}" agregado a la OT`
        : `${times}× kit "${kit.name}" agregado a la OT`,
    )
  }

  const handleApplyKit = () => {
    const kit = activeKits.find((k) => k.id === selectedKitId)
    if (!kit) {
      addToast('Selecciona un kit activo', 'error')
      return
    }
    const times = Math.max(1, Math.floor(Number(kitQty) || 1))
    applyKitToQuantities(kit, times)
  }

  const handleRegister = () => {
    const check = runValidation()
    if (check.status !== 'success') {
      setValidation(check.status === 'error' ? check : { status: 'idle' })
      if (check.status === 'idle') return
      addToast('Valide la disponibilidad antes de registrar', 'error')
      return
    }

    const lines = activeLines.map(({ product, quantity }) => ({
      productId: product.id,
      productCode: product.code,
      productName: product.name,
      quantity,
    }))

    void (async () => {
      const result = await registerSupplies(order.id, lines)
      if (!result.ok) {
        addToast(result.message ?? 'No fue posible registrar los insumos', 'error')
        return
      }
      handleClear()
      void Promise.all([
        useInventoryStore.getState().syncProductsFromApi(),
        useInventoryStore.getState().syncMovementsFromApi(),
      ])
    })()
  }

  const handleRemoveRegistered = (index: number) => {
    const entry = order.suppliesUsed?.[index]
    if (!entry) return
    if (
      !window.confirm(
        `¿Eliminar "${entry.productName}" (${entry.quantity}) de esta OT?\nEl stock se devolverá a bodega.`,
      )
    ) {
      return
    }

    void (async () => {
      setRemovingIndex(index)
      try {
        const result = await removeRegisteredSupply(order.id, index)
        if (!result.ok) {
          addToast(result.message ?? 'No fue posible eliminar el insumo', 'error')
          return
        }
        void Promise.all([
          useInventoryStore.getState().syncProductsFromApi(),
          useInventoryStore.getState().syncMovementsFromApi(),
        ])
      } finally {
        setRemovingIndex(null)
      }
    })()
  }

  const canRegister =
    canEdit && validation.status === 'success' && activeLines.length > 0

  return (
    <Card id="insumos-ot" className="scroll-mt-4 overflow-hidden p-0">
      <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-6 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">Insumos de la OT</h3>
              <p className="mt-0.5 text-sm text-slate-500">
                {order.id} | Cliente: {order.client}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6 p-6">
        {(order.suppliesUsed ?? []).length > 0 && (
          <div>
            <p className="mb-2 text-sm font-semibold text-slate-800">Insumos ya registrados</p>
            <div className="overflow-x-auto rounded-lg border border-slate-100">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Código</th>
                    <th className="px-3 py-2">Producto</th>
                    <th className="px-3 py-2">Cantidad</th>
                    <th className="px-3 py-2">Registrado</th>
                    {canEdit ? <th className="px-3 py-2 text-right">Acciones</th> : null}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {order.suppliesUsed!.map((s, i) => (
                    <tr key={`${s.productId}-${s.registeredAt}-${i}`}>
                      <td className="px-3 py-2 font-mono text-xs">{s.productCode}</td>
                      <td className="px-3 py-2">{s.productName}</td>
                      <td className="px-3 py-2">{s.quantity}</td>
                      <td className="px-3 py-2 text-xs text-slate-500">{s.registeredAt}</td>
                      {canEdit ? (
                        <td className="px-3 py-2 text-right">
                          <Button
                            type="button"
                            variant="outline"
                            className="h-8 px-2 text-red-600 hover:bg-red-50 hover:text-red-700"
                            leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                            disabled={removingIndex === i}
                            onClick={() => handleRemoveRegistered(i)}
                          >
                            {removingIndex === i ? 'Eliminando…' : 'Eliminar'}
                          </Button>
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {canEdit ? (
          <>
            <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">Agregar kit / paquete</p>
                <p className="mt-1 text-sm text-slate-500">
                  Al aplicar un kit se suman automáticamente las cantidades de sus productos.
                </p>
              </div>
              {activeKits.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No hay kits activos. Créalos en Inventario → Kits y Paquetes.
                </p>
              ) : (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                  <div className="min-w-0 flex-1">
                    <label className="mb-1.5 block text-xs font-medium text-slate-600">
                      Kit
                    </label>
                    <Select
                      value={selectedKitId}
                      onChange={(e) => setSelectedKitId(e.target.value)}
                    >
                      {activeKits.map((kit) => (
                        <option key={kit.id} value={kit.id}>
                          {kit.name} ({kit.items.length} productos)
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="w-full sm:w-28">
                    <label className="mb-1.5 block text-xs font-medium text-slate-600">
                      Cantidad
                    </label>
                    <Input
                      type="number"
                      min={1}
                      value={kitQty}
                      onChange={(e) => setKitQty(Math.max(1, Number(e.target.value) || 1))}
                    />
                  </div>
                  <Button
                    type="button"
                    leftIcon={<PackagePlus className="h-4 w-4" />}
                    onClick={handleApplyKit}
                  >
                    Aplicar kit
                  </Button>
                </div>
              )}
              {appliedKits.length > 0 ? (
                <ul className="flex flex-wrap gap-2 pt-1">
                  {appliedKits.map((k) => (
                    <li key={k.kitId}>
                      <Badge
                        label={`${k.quantity}× ${k.kitName}`}
                        className="bg-violet-50 text-violet-700"
                      />
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-900">
                Insumos a utilizar en el trabajo
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Ingrese las cantidades requeridas (o aplique un kit) y valide la disponibilidad
                en bodega antes de registrar.
              </p>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  <tr>
                    <th className="px-4 py-3">Producto</th>
                    <th className="px-4 py-3">Unidad</th>
                    <th className="px-4 py-3">Stock actual</th>
                    <th className="px-4 py-3">Cantidad a usar</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3">Observación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {catalogProducts.map((product) => {
                    const qty = quantities[product.id] ?? 0
                    const hasQty = qty > 0
                    const sufficient = !hasQty || product.currentStock >= qty
                    return (
                      <tr key={product.id} className="bg-white">
                        <td className="px-4 py-3 font-medium text-slate-800">{product.name}</td>
                        <td className="px-4 py-3 text-slate-600">{formatUnitLabel(product)}</td>
                        <td className="px-4 py-3 tabular-nums text-slate-700">
                          {product.currentStock}
                        </td>
                        <td className="px-4 py-3">
                          <Input
                            type="number"
                            min={0}
                            value={hasQty ? qty : ''}
                            placeholder="0"
                            className="max-w-[100px]"
                            onChange={(e) =>
                              setQuantity(
                                product.id,
                                e.target.value === '' ? 0 : Number(e.target.value),
                              )
                            }
                          />
                        </td>
                        <td className="px-4 py-3">
                          {!hasQty ? (
                            <span className="text-xs text-slate-400">Sin solicitar</span>
                          ) : sufficient ? (
                            <Badge
                              label="Disponible"
                              className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                            />
                          ) : (
                            <Badge
                              label="Stock insuficiente"
                              className="inline-flex items-center gap-1 bg-red-50 text-red-700 ring-red-600/20"
                            />
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600">
                          {formatStockObservation(product, qty)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button leftIcon={<Search className="h-4 w-4" />} onClick={handleValidate}>
                Validar disponibilidad
              </Button>
              <Button
                variant="outline"
                leftIcon={<RotateCcw className="h-4 w-4" />}
                onClick={handleClear}
              >
                Limpiar cantidades
              </Button>
              <Button
                variant="outline"
                leftIcon={<Package className="h-4 w-4" />}
                onClick={handleRegister}
                disabled={!canRegister}
              >
                Registrar insumos en la OT
              </Button>
            </div>

            {validation.status === 'error' && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-900">
                <div className="flex gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                  <div>
                    <p className="font-semibold">No es posible continuar</p>
                    <p className="mt-1 text-red-800">
                      Uno o más insumos no cuentan con stock suficiente. Revise las cantidades
                      ingresadas.
                    </p>
                    <ul className="mt-3 list-inside list-disc space-y-1 text-red-800">
                      {validation.failures.map((f) => (
                        <li key={f.productId}>
                          {f.name}: se solicitaron {f.requested} {f.unit} y solo hay{' '}
                          {f.available} {f.unit} disponibles.
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {validation.status === 'success' && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-900">
                <div className="flex gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  <div>
                    <p className="font-semibold">Disponibilidad validada correctamente</p>
                    <p className="mt-1 text-emerald-800">
                      Todos los insumos cuentan con stock suficiente. Puede proceder a registrar el
                      uso de insumos en la OT.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <p className="text-xs text-slate-400">
              El stock en bodega se actualiza automáticamente al confirmar el registro.
            </p>
          </>
        ) : (order.suppliesUsed ?? []).length === 0 ? (
          <p className="text-sm text-slate-500">Sin insumos registrados en esta orden.</p>
        ) : null}
      </div>
    </Card>
  )
}
