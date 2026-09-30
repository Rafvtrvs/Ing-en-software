import { NavLink } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/utils/cn'

const RF47_LINKS = [
  { cu: 'CU-158', label: 'Generar reporte', path: ROUTES.CU158 },
  { cu: 'CU-159', label: 'Filtrar reporte', path: ROUTES.CU159 },
] as const

export function ReportsIncrementoNav() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold text-slate-900">RF47 — Reporte intervenciones de terceros</p>
      <p className="mt-1 text-xs text-slate-500">Vista dedicada por CU para el informe Incremento 2.</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {RF47_LINKS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'rounded-lg border px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-primary/40',
              )
            }
          >
            <span className="block text-[10px] font-semibold uppercase text-slate-500">{item.cu}</span>
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </div>
  )
}
