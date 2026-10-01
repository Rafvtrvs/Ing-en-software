import { WifiOff } from 'lucide-react'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'

/** Banner global RF-36: sin red o conectividad limitada */
export function ConnectivityBanner() {
  const { online, slow } = useNetworkStatus()

  if (online && !slow) return null

  return (
    <div
      role="status"
      className={
        online
          ? 'border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs text-amber-900'
          : 'border-b border-red-200 bg-red-50 px-4 py-2 text-center text-xs text-red-900'
      }
    >
      <span className="inline-flex items-center justify-center gap-2">
        <WifiOff className="h-3.5 w-3.5" />
        {online
          ? 'Conectividad limitada: se reduce la carga de gráficos y medios.'
          : 'Sin conexión: los cambios se guardan en este dispositivo hasta sincronizar.'}
      </span>
    </div>
  )
}
