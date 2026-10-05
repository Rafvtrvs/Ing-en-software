import { useEffect, useState } from 'react'

/**
 * Layout tipo teléfono / Devices (sidebar overlay, sheet, etc.).
 * 767px = típico “móvil”; en PC normal el menú lateral permanece.
 */
export const MOBILE_MAX_WIDTH = 767

/** Formularios apilados también en tablet estrecha */
export const FORM_STACK_MAX_WIDTH = 1023

function readMaxWidth(max: number): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.innerWidth <= max ||
    window.matchMedia(`(max-width: ${max}px)`).matches
  )
}

/**
 * true en viewport de teléfono (Devices).
 * En PC (≥768px) es false → sidebar y layout de escritorio.
 */
export function useIsMobileViewport() {
  const [isMobile, setIsMobile] = useState(() => readMaxWidth(MOBILE_MAX_WIDTH))

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_MAX_WIDTH}px)`)
    const update = () => setIsMobile(readMaxWidth(MOBILE_MAX_WIDTH))
    update()
    mq.addEventListener('change', update)
    window.addEventListener('resize', update)
    return () => {
      mq.removeEventListener('change', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  return isMobile
}

/** true cuando los formularios deben ir en columna (móvil + tablet). */
export function useFormStackViewport() {
  const [stack, setStack] = useState(() => readMaxWidth(FORM_STACK_MAX_WIDTH))

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${FORM_STACK_MAX_WIDTH}px)`)
    const update = () => setStack(readMaxWidth(FORM_STACK_MAX_WIDTH))
    update()
    mq.addEventListener('change', update)
    window.addEventListener('resize', update)
    return () => {
      mq.removeEventListener('change', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  return stack
}
