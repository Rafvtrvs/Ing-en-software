import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useSessionUser } from '@/features/auth/useSessionUser'
import { canAccessPath } from '@/features/auth/roleAccess'
import { ROUTES } from '@/constants/routes'

/** Bloquea rutas según permisos del rol de sesión */
export function RequirePermission({ children }: { children: ReactNode }) {
  const user = useSessionUser()
  const location = useLocation()
  const pathname = location.pathname === '/' ? ROUTES.DASHBOARD : location.pathname

  if (!canAccessPath(user, pathname)) {
    return <Navigate to={ROUTES.ORDENES} replace />
  }

  return <>{children}</>
}
