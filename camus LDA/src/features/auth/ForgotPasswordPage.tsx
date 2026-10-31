import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Mail } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ROUTES } from '@/constants/routes'
import { authService } from '@/services/authService'
import { AuthBrand } from './AuthBrand'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await authService.sendPasswordReset(email)
      setSent(true)
    } catch (err) {
      const code = (err as { code?: string }).code
      if (code === 'auth/user-not-found' || code === 'auth/invalid-email') {
        // No revelar si existe la cuenta
        setSent(true)
      } else {
        setError('No se pudo enviar el correo. Revisá el email e intentá de nuevo.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <AuthBrand
          title="Recuperar contraseña"
          subtitle="Te enviaremos un enlace para restablecer tu acceso"
        />

        {sent ? (
          <div className="space-y-4 text-center">
            <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              Si existe una cuenta asociada a <strong>{email}</strong>, recibirás un correo
              con instrucciones en los próximos minutos.
            </div>
            {!authService.usesFirebase() && (
              <Link
                to={`${ROUTES.RESET_PASSWORD}?email=${encodeURIComponent(email)}`}
                className="block text-sm font-medium text-primary hover:text-primary-hover"
              >
                Continuar para restablecer la contraseña (modo local)
              </Link>
            )}
            <Link
              to="/login"
              className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al inicio de sesión
            </Link>
          </div>
        ) : (
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
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
            )}
            <Button
              type="submit"
              className="w-full justify-center"
              disabled={loading}
              leftIcon={<Mail className="h-4 w-4" />}
            >
              {loading ? 'Enviando…' : 'Enviar enlace'}
            </Button>
            <Link
              to="/login"
              className="inline-flex w-full items-center justify-center gap-1 text-sm text-slate-500 hover:text-slate-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Link>
          </form>
        )}
      </div>
    </div>
  )
}
