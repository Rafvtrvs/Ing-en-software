import { useState } from 'react'
import { Copy, ExternalLink, MapPin, Navigation } from 'lucide-react'
import type { WorkOrder } from '@/types'

/** Ubicación del trabajo: mapa OpenStreetMap + accesos a Google Maps y Waze (RF10) */
export function OrderLocationCard({ order }: { order: WorkOrder }) {
  const { latitude: lat, longitude: lon, address } = order
  const hasCoords = typeof lat === 'number' && typeof lon === 'number'
  const [copied, setCopied] = useState(false)

  const coordsText = hasCoords ? `${lat.toFixed(6)}, ${lon.toFixed(6)}` : ''
  // Sin coordenadas se busca por dirección
  const query = hasCoords ? `${lat},${lon}` : address
  const googleUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
  const wazeUrl = hasCoords
    ? `https://waze.com/ul?ll=${lat},${lon}&navigate=yes`
    : `https://waze.com/ul?q=${encodeURIComponent(address)}&navigate=yes`

  const delta = 0.005
  const mapSrc = hasCoords
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${lon - delta},${lat - delta},${lon + delta},${lat + delta}&layer=mapnik&marker=${lat},${lon}`
    : null

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(coordsText)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* portapapeles no disponible */
    }
  }

  const linkClass =
    'inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50'

  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <MapPin className="h-4 w-4 text-primary" />
          Ubicación del Trabajo
        </div>
        {hasCoords && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-600">
            <Navigation className="h-3 w-3" />
            GPS Activo
          </span>
        )}
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-100 bg-slate-50">
        {mapSrc ? (
          <iframe
            title="Mapa de ubicación"
            src={mapSrc}
            className="h-48 w-full border-0"
            loading="lazy"
          />
        ) : (
          <div className="flex h-32 flex-col items-center justify-center text-center">
            <MapPin className="h-6 w-6 text-slate-300" />
            <p className="mt-2 text-xs text-slate-500">
              Sin coordenadas registradas para esta orden
            </p>
          </div>
        )}
      </div>

      <dl className="mt-3 space-y-1 text-sm">
        <div className="flex gap-2">
          <dt className="font-medium text-slate-500">Dirección:</dt>
          <dd className="text-slate-700">{address || '—'}</dd>
        </div>
        {hasCoords && (
          <div className="flex items-center gap-2">
            <dt className="font-medium text-slate-500">Coordenadas:</dt>
            <dd className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-700">
              {coordsText}
            </dd>
            <button
              type="button"
              onClick={() => void copy()}
              className="ml-auto inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <Copy className="h-3.5 w-3.5" />
              {copied ? 'Copiado' : 'Copiar'}
            </button>
          </div>
        )}
      </dl>

      {(hasCoords || address) && (
        <div className="mt-3 flex gap-2">
          <a href={googleUrl} target="_blank" rel="noreferrer" className={linkClass}>
            <ExternalLink className="h-4 w-4" />
            Google Maps
          </a>
          <a href={wazeUrl} target="_blank" rel="noreferrer" className={linkClass}>
            <Navigation className="h-4 w-4" />
            Waze
          </a>
        </div>
      )}
    </div>
  )
}
