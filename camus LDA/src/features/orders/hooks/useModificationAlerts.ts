import { useEffect } from 'react'
import { useOrdersStore } from '@/store/useOrdersStore'

/** Sincroniza solicitudes para la campanita en la vista PC y en la móvil. */
export function useModificationAlerts() {
  const syncFromApi = useOrdersStore((s) => s.syncFromApi)

  useEffect(() => {
    const pull = () => {
      void syncFromApi()
    }
    pull()
    const timer = window.setInterval(pull, 20000)
    window.addEventListener('focus', pull)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('focus', pull)
    }
  }, [syncFromApi])
}
