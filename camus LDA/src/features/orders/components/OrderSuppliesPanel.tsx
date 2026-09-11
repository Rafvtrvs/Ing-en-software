import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  Package,
  RotateCcw,
  Search,
  Wrench,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { useOrdersStore } from '@/store/useOrdersStore'
import { useInventoryStore } from '@/store/useInventoryStore'
import type { Product, WorkOrder } from '@/types'

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

const EXCLUDED_CATEGORIES = new Set(['Camiones', 'Equipos'])

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
  const addToast = useOrdersStore((s) => s.addToast)
  const products = useInventoryStore((s) => s.products)
  const syncProductsFromApi = useInventoryStore((s) => s.syncProductsFromApi)

  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [validation, setValidation] = useState<ValidationState>({ status: 'idle' })

  useEffect(() => {
    void syncProductsFromApi()
  }, [syncProductsFromApi])

  const catalogProducts = useMemo(
    () =>
      products
        .filter((p) => !EXCLUDED_CATEGORIES.has(p.category))
        .sort((a, b) => {
          if (a.category === 'Insumos' && b.category !== 'Insumos') return -1
          if (b.category === 'Insumos' && a.category !== 'Insumos') return 1
          return a.name.localeCompare(b.name, 'es')
        }),
    [products],
  )

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

    const result = registerSupplies(order.id, lines)
    if (!result.ok) {
      addToast(result.message ?? 'No fue posible registrar los insumos', 'error')
      return
    }
    handleClear()
  }

  const canRegister =
    canEdit && validation.status === 'success' && activeLines.length > 0

  return (
    <Card className="overflow-hidden p-0">
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {order.suppliesUsed!.map((s, i) => (
                    <tr key={`${s.productId}-${i}`}>
                      <td className="px-3 py-2 font-mono text-xs">{s.productCode}</td>
                      <td className="px-3 py-2">{s.productName}</td>
                      <td className="px-3 py-2">{s.quantity}</td>
                      <td className="px-3 py-2 text-xs text-slate-500">{s.registeredAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {canEdit ? (
          <>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Insumos a utilizar en el trabajo
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Ingrese las cantidades requeridas y valide la disponibilidad en bodega antes de
                registrar.
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
