import { NavLink } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/utils/cn'

const RF43_LINKS = [
  { cu: 'CU-147', label: 'Registrar OT', path: ROUTES.CU147 },
  { cu: 'CU-148', label: 'Formulario terreno', path: ROUTES.CU148 },
] as const

const RF46_LINKS = [
  { cu: 'CU-155', label: 'Sin conexión', path: ROUTES.CU155 },
  { cu: 'CU-156', label: 'Sincronizar', path: ROUTES.CU156 },
  { cu: 'CU-157', label: 'Estado sync', path: ROUTES.CU157 },
] as const

function CuLink({ cu, label, path }: { cu: string; label: string; path: string }) {
  return (
    <NavLink
      to={path}
      className={({ isActive }) =>
        cn(
          'rounded-lg border px-3 py-2 text-left text-sm transition-colors',
          isActive
            ? 'border-primary bg-primary/5 text-primary'
            : 'border-slate-200 bg-white text-slate-700 hover:border-primary/40 hover:bg-slate-50',
        )
      }
    >
      <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-500">{cu}</span>
      <span className="font-medium">{label}</span>
    </NavLink>
  )
}

/** Accesos directos Incremento 2 — una pantalla por CU (informe) */
export function OperationsIncrementoNav() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold text-slate-900">Incremento 2 — Vistas por caso de uso</p>
      <p className="mt-1 text-xs text-slate-500">
        RF43 y RF46: abra cada CU en pantalla completa para documentación e informe.
      </p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase text-primary">RF43 · OT en terreno</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {RF43_LINKS.map((item) => (
              <CuLink key={item.path} {...item} />
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase text-primary">RF46 · Offline / sync</p>
          <div className="grid gap-2 sm:grid-cols-3">
            {RF46_LINKS.map((item) => (
              <CuLink key={item.path} {...item} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
