import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { CheckCircle2, Droplets, Loader2 } from 'lucide-react'
import { authService } from '@/services/authService'
import { ROUTES } from '@/constants/routes'

const REDIRECT_DELAY_MS = 2000

export function LoginSuccessPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string })?.from ?? ROUTES.DASHBOARD
  const user = authService.getUser()

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login', { replace: true })
      return
    }

    const timer = window.setTimeout(() => {
      navigate(from, { replace: true })
    }, REDIRECT_DELAY_MS)

    return () => window.clearTimeout(timer)
  }, [from, navigate])

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="w-full max-w-sm rounded-2xl border border-emerald-200 bg-white p-8 text-center shadow-sm">
        <div className="mb-6 flex flex-col items-center">
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white">
            <Droplets className="h-6 w-6" />
          </span>
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
            <CheckCircle2 className="h-9 w-9 text-emerald-600" />
          </div>
          <h1 className="text-lg font-semibold text-slate-900">Login exitoso</h1>
          {user?.name && (
            <p className="mt-1 text-sm text-slate-600">
              Bienvenido, <span className="font-medium">{user.name}</span>
            </p>
          )}
          <p className="mt-3 flex items-center justify-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            Redirigiendo...
          </p>
        </div>
        <p className="text-xs text-slate-400">Alcantarillados Camus Ltda.</p>
      </div>
    </div>
  )
}
