import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { authService } from '@/services/authService'
import { useAppStore } from '@/store/useAppStore'
import { isFieldOperator } from '@/features/auth/roleAccess'
import { ROUTES } from '@/constants/routes'
import { AuthBrand } from './AuthBrand'

const REDIRECT_DELAY_MS = 2000

export function LoginSuccessPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const setUser = useAppStore((s) => s.setUser)
  const from = (location.state as { from?: string })?.from ?? ROUTES.DASHBOARD
  const user = authService.getUser()

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login', { replace: true })
      return
    }

    const authUser = authService.getUser()
    if (authUser) {
      setUser({
        name: authUser.name,
        role: authUser.role,
        avatar: '',
      })
    }

    // Operador/técnico: vista PC (Órdenes con kanban/cola), no forzar /terreno móvil
    const target =
      from === ROUTES.DASHBOARD && isFieldOperator(authUser)
        ? ROUTES.ORDENES
        : from

    const timer = window.setTimeout(() => {
      navigate(target, { replace: true })
    }, REDIRECT_DELAY_MS)

    return () => window.clearTimeout(timer)
  }, [from, navigate, setUser])

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="w-full max-w-sm rounded-2xl border border-emerald-200 bg-white p-8 text-center shadow-sm">
        <div className="mb-2 flex flex-col items-center">
          <AuthBrand />
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900">Sesión iniciada</h2>
          {user?.name && (
            <p className="mt-1 text-sm text-slate-600">
              Bienvenido, <span className="font-medium">{user.name}</span>
            </p>
          )}
          <p className="mt-3 flex items-center justify-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            Redirigiendo...
          </p>
        </div>
        <p className="text-xs text-slate-400">Alcantarillados Camus Ltda.</p>
      </div>
    </div>
  )
}
