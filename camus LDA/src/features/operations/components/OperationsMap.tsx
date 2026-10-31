import { useEffect, useMemo, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { MapPin } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { useOrdersStore } from '@/store/useOrdersStore'
import { daysOverdue, getOverdueOrders } from '@/features/dashboard/utils/dashboardHelpers'
import type { OrderStatus, WorkOrder } from '@/types'
import { cn } from '@/utils/cn'

type MapStatusFilter = 'all' | OrderStatus | 'retrasada'

const STATUS_FILTERS: { value: MapStatusFilter; label: string }[] = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'Pendiente', label: 'Pendiente' },
  { value: 'En Curso', label: 'En Curso' },
  { value: 'Completada', label: 'Completada' },
  { value: 'Abonado', label: 'Abonado' },
  { value: 'Cancelada', label: 'Cancelada' },
  { value: 'retrasada', label: 'Retrasadas' },
]

const legend = [
  { label: 'En Curso', color: 'bg-emerald-500' },
  { label: 'Pendiente', color: 'bg-amber-500' },
  { label: 'Completada', color: 'bg-slate-400' },
  { label: 'Retrasada', color: 'bg-red-500' },
]

const CHILE_CENTER: [number, number] = [-70.6693, -33.4489]

function markerColor(order: WorkOrder, overdueIds: Set<string>): string {
  if (overdueIds.has(order.id)) return '#ef4444'
  if (order.status === 'En Curso') return '#10b981'
  if (order.status === 'Pendiente') return '#f59e0b'
  if (order.status === 'Completada' || order.status === 'Abonado') return '#94a3b8'
  return '#64748b'
}

type OperationsMapProps = {
  title?: string
  /** Si se pasa, el mapa usa estas OT en vez de todas las del store */
  ordersOverride?: WorkOrder[]
  className?: string
  /** Altura más baja (vista móvil) */
  compact?: boolean
}

export function OperationsMap({
  title = 'Mapa de Operaciones en Tiempo Real',
  ordersOverride,
  className,
  compact = false,
}: OperationsMapProps) {
  const storeOrders = useOrdersStore((s) => s.orders)
  const orders = ordersOverride ?? storeOrders
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<mapboxgl.Marker[]>([])
  const [mapError, setMapError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<MapStatusFilter>('all')

  const token = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined

  const overdueIds = useMemo(
    () => new Set(getOverdueOrders(orders).map((o) => o.id)),
    [orders],
  )

  const mappable = useMemo(() => {
    const withCoords = orders.filter(
      (o) =>
        typeof o.latitude === 'number' &&
        typeof o.longitude === 'number' &&
        Number.isFinite(o.latitude) &&
        Number.isFinite(o.longitude),
    )

    if (statusFilter === 'all') return withCoords
    if (statusFilter === 'retrasada') {
      return withCoords.filter((o) => overdueIds.has(o.id))
    }
    return withCoords.filter((o) => o.status === statusFilter)
  }, [orders, statusFilter, overdueIds])

  const mapHeightClass = compact ? 'h-52' : 'h-64 sm:h-72'

  useEffect(() => {
    if (!token || !containerRef.current) return

    mapboxgl.accessToken = token

    try {
      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: CHILE_CENTER,
        zoom: 10,
      })
      map.addControl(new mapboxgl.NavigationControl(), 'top-right')
      mapRef.current = map
      setMapError(null)

      return () => {
        markersRef.current.forEach((m) => m.remove())
        markersRef.current = []
        map.remove()
        mapRef.current = null
      }
    } catch (err) {
      console.error(err)
      setMapError('No se pudo inicializar Mapbox. Revisá el token.')
    }
  }, [token])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !token) return

    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []

    const bounds = new mapboxgl.LngLatBounds()

    for (const order of mappable) {
      const el = document.createElement('button')
      el.type = 'button'
      el.className = 'h-3.5 w-3.5 rounded-full border-2 border-white shadow'
      el.style.backgroundColor = markerColor(order, overdueIds)
      el.title = `${order.id} — ${order.status}`

      const popup = new mapboxgl.Popup({ offset: 12 }).setHTML(
        `<div style="font: 12px/1.4 system-ui,sans-serif">
          <strong>${order.id}</strong><br/>
          ${order.client}<br/>
          <span style="color:#64748b">${order.status}${
            overdueIds.has(order.id) ? ` · ${daysOverdue(order)}d atraso` : ''
          }</span><br/>
          <span style="color:#64748b">${order.address ?? ''}</span>
        </div>`,
      )

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([order.longitude!, order.latitude!])
        .setPopup(popup)
        .addTo(map)

      markersRef.current.push(marker)
      bounds.extend([order.longitude!, order.latitude!])
    }

    if (mappable.length === 1) {
      map.flyTo({ center: [mappable[0]!.longitude!, mappable[0]!.latitude!], zoom: 13 })
    } else if (mappable.length > 1) {
      map.fitBounds(bounds, { padding: 48, maxZoom: 14 })
    }
  }, [mappable, overdueIds, token])

  return (
    <Card className={cn('h-full lg:col-span-1', className)}>
      <CardHeader
        title={title}
        subtitle={
          token
            ? `${mappable.length} OT visibles en el mapa`
            : 'Configurá Mapbox para ver el mapa'
        }
        action={
          token ? (
            <Select
              className="w-44"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as MapStatusFilter)}
              aria-label="Filtrar órdenes del mapa por estado"
            >
              {STATUS_FILTERS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          ) : undefined
        }
      />
      <div className="relative overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
        {!token ? (
          <div
            className={cn(
              'flex flex-col items-center justify-center gap-2 px-6 text-center',
              mapHeightClass,
            )}
          >
            <MapPin className="h-10 w-10 text-slate-300" />
            <p className="text-sm font-medium text-slate-700">Falta el token de Mapbox</p>
            <p className="max-w-sm text-xs text-slate-500">
              Creá un archivo <code className="rounded bg-slate-100 px-1">.env</code> en la raíz
              del proyecto con{' '}
              <code className="rounded bg-slate-100 px-1">VITE_MAPBOX_TOKEN=pk.tu_token</code> y
              reiniciá <code className="rounded bg-slate-100 px-1">npm run dev</code>.
            </p>
          </div>
        ) : mapError ? (
          <div
            className={cn(
              'flex items-center justify-center px-6 text-center text-sm text-red-600',
              mapHeightClass,
            )}
          >
            {mapError}
          </div>
        ) : (
          <>
            <div ref={containerRef} className={cn('w-full', mapHeightClass)} />
            {mappable.length === 0 && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white/50 px-4 text-center text-xs text-slate-600">
                No hay órdenes con coordenadas para este filtro.
              </div>
            )}
          </>
        )}
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        {legend.map((item) => (
          <div key={item.label} className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className={cn('h-2.5 w-2.5 rounded-full', item.color)} />
            {item.label}
          </div>
        ))}
      </div>
    </Card>
  )
}
