import axios from 'axios'

const DEMO_TOKEN_PREFIX = 'demo-token:'

export function isDemoMode(): boolean {
  const token = localStorage.getItem('auth_token')
  return Boolean(token?.startsWith(DEMO_TOKEN_PREFIX))
}

/** Error de red o backend apagado (sin respuesta HTTP útil). */
export function isOfflineApiError(err: unknown): boolean {
  if (!axios.isAxiosError(err)) return true
  return !err.response
}
