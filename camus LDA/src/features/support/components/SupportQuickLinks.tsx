import { BookOpen, FileBarChart, Settings, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardHeader } from '@/components/ui/Card'
import { ROUTES } from '@/constants/routes'

const links = [
  { label: 'Reportes', path: ROUTES.REPORTES, icon: FileBarChart },
  { label: 'Usuarios y Roles', path: ROUTES.USUARIOS, icon: Users },
  { label: 'Parámetros', path: ROUTES.PARAMETROS, icon: Settings },
  { label: 'Configuración', path: ROUTES.CONFIGURACION, icon: BookOpen },
]

export function SupportQuickLinks() {
  return (
    <Card>
      <CardHeader title="Enlaces útiles" />
      <div className="grid gap-2 sm:grid-cols-2">
        {links.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
          >
            <link.icon className="h-4 w-4" />
            {link.label}
          </Link>
        ))}
      </div>
    </Card>
  )
}
