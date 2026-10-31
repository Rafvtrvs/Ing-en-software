import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { LogIn } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { MobileFormsMode } from '@/components/layout/MobileFormsMode'
import { authService } from '@/services/authService'
import { registerAdminPushIfNeeded } from '@/lib/pushNotifications'
import { ROUTES } from '@/constants/routes'
import { AuthBrand } from './AuthBrand'

// Pantalla de autenticación. Con Firebase: Auth SDK + idToken → API.
export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string; message?: string })?.from ?? '/'
  const successMessage =
    (location.state as { message?: string })?.message ?? ''

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await authService.login(email, password)
      void registerAdminPushIfNeeded(user.role)
      navigate(ROUTES.LOGIN_SUCCESS, { replace: true, state: { from } })
    } catch (err) {
      const code = (err as { code?: string }).code
      if (code === 'INVALID_CREDENTIALS') {
        setError('Credenciales inválidas. Revisa el correo y la contraseña.')
      } else if (code === 'auth/too-many-requests') {
        setError('Demasiados intentos. Esperá un momento e intentá de nuevo.')
      } else {
        const msg = (err as { response?: { data?: { error?: string } }; message?: string })
          ?.response?.data?.error
        setError(msg ?? 'No fue posible iniciar sesión. Intenta nuevamente.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <MobileFormsMode />
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <AuthBrand subtitle="Inicia sesión para continuar" />

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Correo
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <div className="mt-2 text-right">
              <Link
                to={ROUTES.FORGOT_PASSWORD}
                className="text-xs font-medium text-primary hover:text-primary-hover"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
          </div>

          {successMessage && (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {successMessage}
            </p>
          )}

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          <Button
            type="submit"
            className="w-full justify-center"
            disabled={loading}
            leftIcon={<LogIn className="h-4 w-4" />}
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </Button>

          {authService.usesFirebase() && (
            <p className="text-center text-[11px] text-slate-400">
              Acceso con Firebase Auth · recuperación por correo habilitada
            </p>
          )}
        </form>
      </div>
    </div>
  )
}
