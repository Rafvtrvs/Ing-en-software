import { useCallback, useEffect, useState } from 'react'
import { Calculator, Download, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { estimatesService } from '@/services/estimatesService'
import { useBillingStore } from '@/store/useBillingStore'
import { useParametersStore } from '@/store/useParametersStore'
import { downloadEstimate } from '@/features/billing/utils/estimatePdf'
import { formatCurrency } from '@/utils/formatters'
import type { CostEstimate, CostRate, CostRateType, EstimateTotals } from '@/types'

const TYPE_LABEL: Record<CostRateType, string> = {
  insumo: 'Insumo',
  maquinaria: 'Maquinaria',
  combustible: 'Combustible',
  personal: 'Personal',
}

interface Row {
  rateId: string
  quantity: string
}

function errorMessage(err: unknown, fallback: string) {
  return (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? fallback
}

/** RF16 — CU-60 calcular costos de insumos y recursos · CU-61 presentar estimación al cliente */
export function EstimatesPanel() {
  const addToast = useBillingStore((s) => s.addToast)
  const taxRate = useParametersStore((s) => s.parameters.billing.taxRate)

  const [rates, setRates] = useState<CostRate[]>([])
  const [estimates, setEstimates] = useState<CostEstimate[]>([])
  const [rows, setRows] = useState<Row[]>([{ rateId: '', quantity: '1' }])
  const [description, setDescription] = useState('')
  const [result, setResult] = useState<EstimateTotals | null>(null)
  const [selected, setSelected] = useState<CostEstimate | null>(null)
  const [newRate, setNewRate] = useState({ type: 'insumo' as CostRateType, name: '', unit: 'unidad', price: '' })
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    try {
      const [r, e] = await Promise.all([estimatesService.listRates(), estimatesService.list()])
      setRates(r)
      setEstimates(e)
    } catch (err) {
      addToast(errorMessage(err, 'No se pudieron cargar las tarifas y estimaciones'), 'error')
    }
  }, [addToast])

  useEffect(() => {
    void load()
  }, [load])

  const payload = () => ({
    items: rows
      .filter((r) => r.rateId)
      .map((r) => ({ rateId: Number(r.rateId), quantity: Number(r.quantity) })),
    taxRate,
  })

  const updateRow = (i: number, patch: Partial<Row>) => {
    setResult(null)
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))
  }

  /** CU-60: "Obtener costos" */
  const handleCalculate = async () => {
    setBusy(true)
    try {
      setResult(await estimatesService.calculate(payload()))
    } catch (err) {
      setResult(null)
      addToast(errorMessage(err, 'No se pudo calcular el costo'), 'error')
    } finally {
      setBusy(false)
    }
  }

  const handleSave = async () => {
    setBusy(true)
    try {
      const created = await estimatesService.create({ ...payload(), description })
      addToast('Estimación guardada')
      setSelected(created)
      setDescription('')
      await load()
    } catch (err) {
      addToast(errorMessage(err, 'No se pudo guardar la estimación'), 'error')
    } finally {
      setBusy(false)
    }
  }

  const handleAddRate = async () => {
    try {
      await estimatesService.createRate({
        type: newRate.type,
        name: newRate.name,
        unit: newRate.unit,
        unitPrice: Number(newRate.price),
      })
      setNewRate({ ...newRate, name: '', price: '' })
      await load()
    } catch (err) {
      addToast(errorMessage(err, 'No se pudo crear la tarifa'), 'error')
    }
  }

  const handleRemoveRate = async (id: number) => {
    try {
      await estimatesService.removeRate(id)
      await load()
    } catch (err) {
      addToast(errorMessage(err, 'No se pudo eliminar la tarifa'), 'error')
    }
  }

  const detail = selected ?? null

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="space-y-4">
        <div className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          <div>
            <h2 className="text-base font-semibold text-slate-900">Estimación de costos</h2>
            <p className="text-xs text-slate-500">Materiales, maquinaria, combustible y personal (+ IVA {taxRate}%)</p>
          </div>
        </div>

        {rows.map((row, i) => (
          <div key={i} className="flex items-end gap-2">
            <FormField label={i === 0 ? 'Recurso' : ''} className="flex-1">
              <Select value={row.rateId} onChange={(e) => updateRow(i, { rateId: e.target.value })}>
                <option value="">Seleccionar…</option>
                {rates.map((r) => (
                  <option key={r.id} value={r.id}>
                    {TYPE_LABEL[r.type]} · {r.name} ({formatCurrency(r.unitPrice)}/{r.unit})
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label={i === 0 ? 'Cantidad' : ''} className="w-24">
              <Input
                type="number"
                min="0"
                step="any"
                value={row.quantity}
                onChange={(e) => updateRow(i, { quantity: e.target.value })}
              />
            </FormField>
            {rows.length > 1 && (
              <button
                type="button"
                aria-label="Quitar ítem"
                className="mb-2 text-red-500"
                onClick={() => {
                  setResult(null)
                  setRows((prev) => prev.filter((_, idx) => idx !== i))
                }}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}

        <Button
          variant="ghost"
          size="sm"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setRows((prev) => [...prev, { rateId: '', quantity: '1' }])}
        >
          Agregar ítem
        </Button>

        <div>
          <Button onClick={() => void handleCalculate()} disabled={busy}>
            Obtener costos
          </Button>
        </div>

        {result && (
          <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm">
            {result.lines.map((l) => (
              <div key={l.rateId + l.name} className="flex justify-between py-0.5">
                <span>
                  {l.name} × {l.quantity} {l.unit}
                </span>
                <span>{formatCurrency(l.amount)}</span>
              </div>
            ))}
            <div className="mt-2 flex justify-between border-t border-slate-200 pt-2">
              <span>Subtotal</span>
              <span>{formatCurrency(result.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>IVA ({result.taxRate}%)</span>
              <span>{formatCurrency(result.tax)}</span>
            </div>
            <div className="flex justify-between text-base font-semibold">
              <span>Total</span>
              <span>{formatCurrency(result.total)}</span>
            </div>
            <div className="mt-3 flex items-end gap-2">
              <Input
                placeholder="Descripción (ej. cliente / servicio)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <Button variant="outline" onClick={() => void handleSave()} disabled={busy}>
                Guardar estimación
              </Button>
            </div>
          </div>
        )}

        <details className="text-sm">
          <summary className="cursor-pointer font-medium text-slate-700">Tarifas ({rates.length})</summary>
          <div className="mt-2 space-y-1">
            {rates.map((r) => (
              <div key={r.id} className="flex items-center justify-between text-xs text-slate-600">
                <span>
                  {TYPE_LABEL[r.type]} · {r.name} — {formatCurrency(r.unitPrice)}/{r.unit}
                </span>
                <button type="button" aria-label="Eliminar tarifa" onClick={() => void handleRemoveRate(r.id)}>
                  <Trash2 className="h-3.5 w-3.5 text-red-500" />
                </button>
              </div>
            ))}
            <div className="flex flex-wrap items-end gap-2 pt-2">
              <Select
                className="w-32"
                value={newRate.type}
                onChange={(e) => setNewRate({ ...newRate, type: e.target.value as CostRateType })}
              >
                {Object.entries(TYPE_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
              <Input
                className="min-w-[120px] flex-1"
                placeholder="Nombre"
                value={newRate.name}
                onChange={(e) => setNewRate({ ...newRate, name: e.target.value })}
              />
              <Input
                className="w-20"
                placeholder="Unidad"
                value={newRate.unit}
                onChange={(e) => setNewRate({ ...newRate, unit: e.target.value })}
              />
              <Input
                className="w-24"
                type="number"
                placeholder="Valor"
                value={newRate.price}
                onChange={(e) => setNewRate({ ...newRate, price: e.target.value })}
              />
              <Button size="sm" onClick={() => void handleAddRate()}>
                Agregar
              </Button>
            </div>
          </div>
        </details>
      </Card>

      <Card className="space-y-3">
        <h2 className="text-base font-semibold text-slate-900">Estimaciones generadas</h2>
        {estimates.length === 0 && <p className="text-sm text-slate-500">Aún no hay estimaciones guardadas.</p>}
        <ul className="divide-y divide-slate-100">
          {estimates.map((e) => (
            <li key={e.id}>
              <button
                type="button"
                onClick={() => setSelected(e)}
                className="flex w-full items-center justify-between py-2 text-left text-sm hover:bg-slate-50"
              >
                <span>
                  #{e.id} {e.description || 'Sin descripción'}
                  <span className="ml-2 text-xs text-slate-400">
                    {new Date(e.createdAt).toLocaleDateString('es-CL')}
                  </span>
                </span>
                <span className="font-medium">{formatCurrency(e.total)}</span>
              </button>
            </li>
          ))}
        </ul>

        {detail && (
          <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm">
            <p className="mb-2 font-medium">Estimación #{detail.id}</p>
            {detail.lines.map((l) => (
              <div key={l.rateId + l.name} className="flex justify-between py-0.5">
                <span>
                  {l.name} × {l.quantity} {l.unit}
                </span>
                <span>{formatCurrency(l.amount)}</span>
              </div>
            ))}
            <div className="mt-2 flex justify-between border-t border-slate-200 pt-2">
              <span>Subtotal</span>
              <span>{formatCurrency(detail.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>IVA ({detail.taxRate}%)</span>
              <span>{formatCurrency(detail.tax)}</span>
            </div>
            <div className="flex justify-between text-base font-semibold">
              <span>Total</span>
              <span>{formatCurrency(detail.total)}</span>
            </div>
            <Button
              className="mt-3"
              variant="outline"
              leftIcon={<Download className="h-4 w-4" />}
              onClick={() => downloadEstimate(detail)}
            >
              Descargar estimación
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}
