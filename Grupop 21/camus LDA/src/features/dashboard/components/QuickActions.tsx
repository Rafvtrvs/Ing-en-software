import {
  Calendar,
  ClipboardList,
  FileBarChart,
  Package,
  UserPlus,
  Users,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardHeader } from '@/components/ui/Card'
import { cn } from '@/utils/cn'

const actions = [
  { label: 'Nueva Orden', path: '/ordenes', icon: ClipboardList },
  { label: 'Nuevo Cliente', path: '/clientes', icon: UserPlus },
  { label: 'Ver Calendario', path: '/operaciones', icon: Calendar },
  { label: 'Reporte de Órdenes', path: '/reportes', icon: FileBarChart },
  { label: 'Inventario', path: '/inventario', icon: Package },
  { label: 'Usuarios', path: '/usuarios', icon: Users },
]

export function QuickActions() {
  return (
    <Card>
      <CardHeader title="Acciones Rápidas" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {actions.map((action) => (
          <Link
            key={action.label}
            to={action.path}
            className={cn(
              'flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white p-4',
              'text-center text-xs font-medium text-slate-700 transition-colors',
              'hover:border-primary/30 hover:bg-blue-50/50 hover:text-primary',
            )}
          >
            <action.icon className="h-5 w-5 text-slate-500" />
            {action.label}
          </Link>
        ))}
      </div>
    </Card>
  )
}
