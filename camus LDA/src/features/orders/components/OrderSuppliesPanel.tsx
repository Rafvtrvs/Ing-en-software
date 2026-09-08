import { useEffect, useMemo, useState } from 'react'
import { Package, Plus, Trash2 } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { FormField } from '@/components/ui/FormField'
import { useOrdersStore } from '@/store/useOrdersStore'
import { useInventoryStore } from '@/store/useInventoryStore'
import type { WorkOrder } from '@/types'

interface SupplyDraft {
  productId: string
  quantity: number
}

/**
 * RF62 — CDS 213/214/215: Registro de insumos con validación de stock y actualización automática
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

  const [drafts, setDrafts] = useState<SupplyDraft[]>([{ productId: '', quantity: 1 }])
  const [validationMsg, setValidationMsg] = useState<string | null>(null)

  useEffect(() => {
    void syncProductsFromApi()
  }, [syncProductsFromApi])

  const supplyProducts = useMemo(
    () => products.filter((p) => p.category === 'Insumos' || p.category === 'Repuestos'),
    [products],
  )

  const validateAvailability = () => {
    const lines = drafts.filter((d) => d.productId && d.quantity > 0)
    if (lines.length === 0) {
      setValidationMsg('Seleccione al menos un insumo')
      return
    }
    const messages: string[] = []
    for (const line of lines) {
      const product = products.find((p) => p.id === line.productId)
      if (!product) continue
      const ok = product.currentStock >= line.quantity
      messages.push(
        `${product.name}: ${ok ? '✓' : '✗'} disponible ${product.currentStock} / solicitado ${line.quantity}`,
      )
    }
    setValidationMsg(messages.join(' · '))
  }

  const handleRegister = () => {
    const lines = drafts
      .filter((d) => d.productId && d.quantity > 0)
      .map((d) => {
        const product = products.find((p) => p.id === d.productId)!
        return {
          productId: d.productId,
          productCode: product.code,
          productName: product.name,
          quantity: d.quantity,
        }
      })

    const result = registerSupplies(order.id, lines)
    if (!result.ok) {
      addToast(result.message ?? 'No fue posible registrar los insumos', 'error')
      return
    }
    setDrafts([{ productId: '', quantity: 1 }])
    setValidationMsg(null)
  }

  return (
    <Card>
      <CardHeader
        title="Insumos Utilizados"
        subtitle="Registro de insumos en la orden de trabajo."
      />

      {(order.suppliesUsed ?? []).length > 0 && (
        <div className="mb-4 overflow-x-auto">
          <table className="w-full min-w-[400px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase text-slate-400">
                <th className="pb-2 pr-4">Código</th>
                <th className="pb-2 pr-4">Insumo</th>
                <th className="pb-2 pr-4">Cantidad</th>
                <th className="pb-2">Registrado</th>
              </tr>
            </thead>
            <tbody>
              {order.suppliesUsed!.map((s, i) => (
                <tr key={`${s.productId}-${i}`} className="border-b border-slate-50">
                  <td className="py-2 pr-4 font-mono text-xs">{s.productCode}</td>
                  <td className="py-2 pr-4">{s.productName}</td>
                  <td className="py-2 pr-4">{s.quantity}</td>
                  <td className="py-2 text-xs text-slate-500">{s.registeredAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {canEdit && (
        <div className="space-y-3">
          {drafts.map((draft, index) => (
            <div
              key={index}
              className="flex flex-col gap-2 rounded-lg border border-slate-100 bg-slate-50 p-3 sm:flex-row sm:items-end"
            >
              <FormField label="Insumo" className="flex-1">
                <Select
                  value={draft.productId}
                  onChange={(e) => {
                    const next = [...drafts]
                    next[index] = { ...next[index], productId: e.target.value }
                    setDrafts(next)
                  }}
                >
                  <option value="">Seleccionar insumo...</option>
                  {supplyProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} — {p.name} (stock: {p.currentStock})
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Cantidad" className="w-full sm:w-28">
                <Input
                  type="number"
                  min={1}
                  value={draft.quantity}
                  onChange={(e) => {
                    const next = [...drafts]
                    next[index] = {
                      ...next[index],
                      quantity: Math.max(1, Number(e.target.value) || 1),
                    }
                    setDrafts(next)
                  }}
                />
              </FormField>
              {drafts.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label="Quitar línea"
                  onClick={() => setDrafts(drafts.filter((_, i) => i !== index))}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              )}
            </div>
          ))}

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => setDrafts([...drafts, { productId: '', quantity: 1 }])}
            >
              Agregar insumo
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={validateAvailability}
            >
              Validar disponibilidad
            </Button>
            <Button
              size="sm"
              leftIcon={<Package className="h-4 w-4" />}
              onClick={handleRegister}
            >
              Registrar insumos
            </Button>
          </div>

          {validationMsg && (
            <p className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-800">
              {validationMsg}
            </p>
          )}
          <p className="text-xs text-slate-400">
            El stock se actualiza automáticamente al registrar insumos.
          </p>
        </div>
      )}

      {!canEdit && (order.suppliesUsed ?? []).length === 0 && (
        <p className="text-sm text-slate-500">Sin insumos registrados.</p>
      )}
    </Card>
  )
}
