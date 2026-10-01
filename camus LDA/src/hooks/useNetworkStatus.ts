import { useEffect, useState } from 'react'

/** RF-36 CU-124 — estado de conectividad para optimizar carga en móvil */
export function useNetworkStatus() {
  const [online, setOnline] = useState(
    typeof navigator === 'undefined' ? true : navigator.onLine,
  )
  const [slow, setSlow] = useState(false)

  useEffect(() => {
    const onOnline = () => setOnline(true)
    const onOffline = () => setOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)

    const connection = (
      navigator as Navigator & {
        connection?: { saveData?: boolean; effectiveType?: string; addEventListener?: Function; removeEventListener?: Function }
      }
    ).connection

    const updateConn = () => {
      if (!connection) {
        setSlow(false)
        return
      }
      const effective = connection.effectiveType ?? ''
      setSlow(
        Boolean(connection.saveData) ||
          effective === '2g' ||
          effective === 'slow-2g',
      )
    }
    updateConn()
    connection?.addEventListener?.('change', updateConn)

    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
      connection?.removeEventListener?.('change', updateConn)
    }
  }, [])

  return { online, slow, reducedData: !online || slow }
}
