import { Link2, Mail, Unlink } from 'lucide-react'

export function UserEmailHelpPanel() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-700 shadow-sm">
      <p className="font-semibold text-slate-900">Correo electrónico del usuario</p>
      <p className="mt-1 text-xs text-slate-500">
        En la columna Acciones use el icono de sobre. Los tres pasos son modales distintos:
      </p>
      <ul className="mt-3 space-y-2">
        <li className="flex gap-2">
          <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <span>
            <strong>Consulta</strong> — ve nombre, rol y si el correo está vinculado o no.
          </span>
        </li>
        <li className="flex gap-2">
          <Link2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          <span>
            <strong>Vincular correo</strong> — modal «Vincular correo electrónico»: escribe un email y
            pulsa «Confirmar vinculación».
          </span>
        </li>
        <li className="flex gap-2">
          <Unlink className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          <span>
            <strong>Desvincular correo</strong> — modal «Desvincular correo electrónico» con confirmación.
          </span>
        </li>
      </ul>
    </div>
  )
}
