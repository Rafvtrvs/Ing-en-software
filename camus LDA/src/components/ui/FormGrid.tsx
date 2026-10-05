import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

type DesktopCols = 1 | 2 | 3 | 4

/**
 * En móvil/tablet (< lg): siempre columna (CSS, sin JS).
 * En desktop (≥ lg): columnas según `cols`.
 */
export function FormGrid({
  children,
  cols = 2,
  className,
}: {
  children: ReactNode
  cols?: DesktopCols
  className?: string
}) {
  const desktopCols =
    cols === 1
      ? 'lg:grid-cols-1'
      : cols === 3
        ? 'lg:grid-cols-3'
        : cols === 4
          ? 'lg:grid-cols-4'
          : 'lg:grid-cols-2'

  return (
    <div
      className={cn(
        // Móvil: flex columna forzado (gana a cualquier .grid heredado)
        'flex w-full flex-col gap-4',
        // Desktop: grilla
        'lg:grid lg:gap-4',
        desktopCols,
        className,
      )}
    >
      {children}
    </div>
  )
}
