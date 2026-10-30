import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Mail } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ROUTES } from '@/constants/routes'
import { AuthBrand } from './AuthBrand'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await new Promise((r) => setTimeout(r, 800))
    setSent(true)
    setLoading(false)
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
            <Link
              to={`${ROUTES.RESET_PASSWORD}?email=${encodeURIComponent(email)}`}
              className="block text-sm font-medium text-primary hover:text-primary-hover"
            >
              Continuar para restablecer la contraseña
            </Link>
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
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="usuario@camus.cl"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <Button
              type="submit"
              className="w-full justify-center"
              disabled={loading}
              leftIcon={<Mail className="h-4 w-4" />}
            >
              {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
            </Button>
            <Link
              to="/login"
              className="flex items-center justify-center gap-1 text-sm text-slate-500 hover:text-slate-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al inicio de sesión
            </Link>
          </form>
        )}
      </div>
    </div>
  )
}
