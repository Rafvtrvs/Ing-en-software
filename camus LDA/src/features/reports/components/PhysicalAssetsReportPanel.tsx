import { useEffect, useMemo, useState } from 'react'
import { CheckCircle, Filter, Truck, Wand2 } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { KpiCard } from '@/components/ui/KpiCard'
import { useInventoryStore } from '@/store/useInventoryStore'
import { useOrdersStore } from '@/store/useOrdersStore'
import { useReportsStore } from '@/store/useReportsStore'
import {
  findOrdersForAsset,
  getMachineryCategories,
  getPhysicalAssets,
  type PhysicalAssetOption,
} from '@/features/reports/utils/assetUsageReport'

function assetKey(asset: PhysicalAssetOption) {
  return `${asset.kind}:${asset.id}`
}

export function PhysicalAssetsReportPanel() {
  const products = useInventoryStore((s) => s.products)
  const orders = useOrdersStore((s) => s.orders)
  const addToast = useReportsStore((s) => s.addToast)

  const categories = useMemo(() => getMachineryCategories(products), [products])

  const [showFilters, setShowFilters] = useState(true)
  const [category, setCategory] = useState('')
  const [assetKeySelected, setAssetKeySelected] = useState('')
  const [generated, setGenerated] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  const assetsInCategory = useMemo(
    () => getPhysicalAssets(products, category || undefined),
    [products, category],
  )

  const selectedAsset = useMemo(() => {
    return assetsInCategory.find((a) => assetKey(a) === assetKeySelected) ?? null
  }, [assetsInCategory, assetKeySelected])

  const services = useMemo(() => {
    if (!generated || !selectedAsset) return []
    return findOrdersForAsset(selectedAsset, orders)
  }, [generated, selectedAsset, orders])

  useEffect(() => {
    if (!category && categories.length > 0) {
      const defaultCat = categories.includes('Vehículos')
        ? 'Vehículos'
        : categories.includes('Camiones')
          ? 'Camiones'
          : categories[0]
      setCategory(defaultCat)
    }
  }, [categories, category])

  useEffect(() => {
    if (assetsInCategory.length === 0) {
      setAssetKeySelected('')
      return
    }
    const stillValid = assetsInCategory.some((a) => assetKey(a) === assetKeySelected)
    if (!stillValid) {
      setAssetKeySelected(assetKey(assetsInCategory[0]))
    }
  }, [assetsInCategory, assetKeySelected])

  const handleGenerate = () => {
    if (!selectedAsset) return
    setGenerated(true)
    setConfirmed(false)
    const count = findOrdersForAsset(selectedAsset, orders).length
    addToast(
      count > 0
        ? `Informe de uso generado: ${count} servicio(s) encontrado(s)`
        : 'No se encontraron servicios asociados al activo seleccionado',
      count > 0 ? 'success' : 'info',
    )
  }

  const handleConfirm = () => {
    if (!selectedAsset || services.length === 0) return
    setConfirmed(true)
    addToast(
      `Informe de recursos confirmado para ${selectedAsset.code} (${services.length} servicios)`,
    )
  }

  const kpis = [
    {
      title: 'Categorías',
      value: String(categories.length),
      trend: 'Maquinaria disponible',
      trendDirection: 'up' as const,
      icon: Truck,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Activos filtrados',
      value: String(assetsInCategory.length),
      trend: category || 'Todas',
      trendDirection: 'up' as const,
      icon: Truck,
      iconBg: 'bg-violet-50',
      iconColor: 'text-violet-600',
    },
    {
      title: 'Servicios operados',
      value: generated ? String(services.length) : '—',
      trend: selectedAsset ? selectedAsset.code : 'Selecciona activo',
      trendDirection: 'up' as const,
      icon: CheckCircle,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.title} data={kpi} />
        ))}
      </div>

      <Card>
        <CardHeader
          title="Reportes de activos físicos"
          subtitle="Filtra por categoría y máquina, cruza con órdenes de trabajo y genera el informe de uso."
          action={
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Filter className="h-4 w-4" />}
              onClick={() => setShowFilters((v) => !v)}
            >
              Filtros
            </Button>
          }
        />

        <div className="mb-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Categorías de maquinaria
          </p>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setCategory(cat)
                  setGenerated(false)
                  setConfirmed(false)
                }}
                className="rounded-full focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <Badge
                  label={cat}
                  className={
                    category === cat
                      ? 'bg-primary/10 text-primary ring-primary/30'
                      : 'bg-slate-100 text-slate-700'
                  }
                />
              </button>
            ))}
          </div>
        </div>

        {showFilters && (
          <div className="mb-4 grid gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600">
                Categoría
              </label>
              <Select value={category} onChange={(e) => setCategory(e.target.value)}>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600">
                Máquina / equipo
              </label>
              <Select
                value={assetKeySelected}
                onChange={(e) => {
                  setAssetKeySelected(e.target.value)
                  setGenerated(false)
                  setConfirmed(false)
                }}
                disabled={assetsInCategory.length === 0}
              >
                {assetsInCategory.map((asset) => (
                  <option key={assetKey(asset)} value={assetKey(asset)}>
                    {asset.code} — {asset.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-600">
            {selectedAsset ? (
              <>
                Activo: <span className="font-semibold">{selectedAsset.name}</span> (
                {selectedAsset.category})
              </>
            ) : (
              'Selecciona una categoría y un activo.'
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              leftIcon={<Wand2 className="h-4 w-4" />}
              onClick={handleGenerate}
              disabled={!selectedAsset}
            >
              Generar informe de uso
            </Button>
            {generated && services.length > 0 && (
              <Button
                type="button"
                variant="outline"
                leftIcon={<CheckCircle className="h-4 w-4" />}
                onClick={handleConfirm}
                disabled={confirmed}
              >
                {confirmed ? 'Informe confirmado' : 'Confirmar informe'}
              </Button>
            )}
          </div>
        </div>

        {generated && (
          <div className="mt-4 space-y-3">
            <p className="text-sm font-semibold text-slate-900">
              Servicios donde operó el equipo (cruce con órdenes de trabajo)
            </p>
            {services.length === 0 ? (
              <p className="rounded-xl border border-slate-100 bg-white p-4 text-sm text-slate-500">
                No hay órdenes vinculadas a este activo en el módulo de órdenes.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-100">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <th className="px-4 py-3 text-xs font-semibold uppercase text-slate-500">
                        OT
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase text-slate-500">
                        Cliente
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase text-slate-500">
                        Servicio
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase text-slate-500">
                        Técnico
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase text-slate-500">
                        Estado
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase text-slate-500">
                        Vínculo
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {services.map((row) => (
                      <tr key={row.orderId} className="hover:bg-slate-50/80">
                        <td className="px-4 py-3 font-medium text-slate-900">{row.orderId}</td>
                        <td className="px-4 py-3 text-slate-700">{row.client}</td>
                        <td className="px-4 py-3 text-slate-700">{row.service}</td>
                        <td className="px-4 py-3 text-slate-600">{row.technician ?? '—'}</td>
                        <td className="px-4 py-3">
                          <Badge label={row.status} context="order" />
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">{row.linkType}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {confirmed && services.length > 0 && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-sm text-emerald-800">
                Informe de recursos confirmado para <strong>{selectedAsset?.code}</strong> con{' '}
                {services.length} servicio(s) registrado(s).
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}
