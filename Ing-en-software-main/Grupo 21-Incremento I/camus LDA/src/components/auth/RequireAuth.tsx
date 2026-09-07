import { Navigate, useLocation } from 'react-router-dom'
import { authService } from '@/services/authService'

// Guard de rutas: equivale al middleware de autenticación del diagrama
// en el lado de la Vista. Si no hay sesión, redirige al login.
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }
  return <>{children}</>
}
