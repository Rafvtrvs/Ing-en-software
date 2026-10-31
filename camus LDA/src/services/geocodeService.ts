/** Geocoding con Mapbox: dirección de texto → lat/lng (Chile). */

export type GeoCoords = { latitude: number; longitude: number }

type MapboxFeature = {
  center?: [number, number]
  place_name?: string
}

type MapboxResponse = {
  features?: MapboxFeature[]
}

const cache = new Map<string, GeoCoords | null>()

function token(): string | undefined {
  return import.meta.env.VITE_MAPBOX_TOKEN as string | undefined
}

function normalizeQuery(address: string): string {
  const trimmed = address.trim()
  if (!trimmed) return ''
  // Sesgo a Chile si no lo menciona
  if (!/\bchile\b/i.test(trimmed) && !/\bsantiago\b/i.test(trimmed)) {
    return `${trimmed}, Chile`
  }
  if (!/\bchile\b/i.test(trimmed)) {
    return `${trimmed}, Chile`
  }
  return trimmed
}

/** Convierte una dirección en coordenadas. Devuelve null si no hay resultado. */
export async function geocodeAddress(address: string): Promise<GeoCoords | null> {
  const accessToken = token()
  const query = normalizeQuery(address)
  if (!accessToken || !query || query.length < 5) return null

  const key = query.toLowerCase()
  if (cache.has(key)) return cache.get(key) ?? null

  try {
    const url =
      `https://api.mapbox.com/geocoding/v5/mapbox.places/` +
      `${encodeURIComponent(query)}.json` +
      `?access_token=${encodeURIComponent(accessToken)}` +
      `&country=cl&language=es&limit=1&types=address,place,locality,neighborhood,poi`

    const res = await fetch(url)
    if (!res.ok) {
      cache.set(key, null)
      return null
    }
    const data = (await res.json()) as MapboxResponse
    const center = data.features?.[0]?.center
    if (!center || center.length < 2) {
      cache.set(key, null)
      return null
    }
    const coords: GeoCoords = { longitude: center[0], latitude: center[1] }
    cache.set(key, coords)
    return coords
  } catch {
    cache.set(key, null)
    return null
  }
}

export function hasOrderCoords(order: {
  latitude?: number | null
  longitude?: number | null
}): boolean {
  return (
    typeof order.latitude === 'number' &&
    typeof order.longitude === 'number' &&
    Number.isFinite(order.latitude) &&
    Number.isFinite(order.longitude)
  )
}
