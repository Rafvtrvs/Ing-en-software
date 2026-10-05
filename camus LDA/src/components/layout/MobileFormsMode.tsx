import { useEffect } from 'react'
import { useFormStackViewport } from '@/hooks/useIsMobileViewport'

/**
 * Marca el documento para apilar formularios (móvil / tablet ≤1023px).
 * El layout PC (sidebar) usa otro breakpoint (≤767px).
 */
export function MobileFormsMode() {
  const stackForms = useFormStackViewport()

  useEffect(() => {
    const root = document.documentElement
    if (stackForms) {
      root.dataset.mobileForms = 'stack'
    } else {
      delete root.dataset.mobileForms
    }
    return () => {
      delete root.dataset.mobileForms
    }
  }, [stackForms])

  return null
}
