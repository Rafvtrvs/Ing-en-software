import { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { authService } from '@/services/authService'
import { registerAdminPushIfNeeded } from '@/lib/pushNotifications'

// Guard de rutas: equivale al middleware de autenticación del diagrama
// en el lado de la Vista. Si no hay sesión, redirige al login.
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const authenticated = authService.isAuthenticated()

  useEffect(() => {
    if (!authenticated) return
    const user = authService.getUser()
    if (user?.role) void registerAdminPushIfNeeded(user.role)
  }, [authenticated])

  if (!authenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }
  return <>{children}</>
}
