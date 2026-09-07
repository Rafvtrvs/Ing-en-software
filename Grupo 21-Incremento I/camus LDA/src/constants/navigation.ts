import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Package,
  MapPin,
  FileText,
  BarChart3,
  UserCog,
  Settings2,
  Settings,
  Headphones,
} from 'lucide-react'
import type { NavSection } from '@/types'
import { ROUTES } from './routes'

export const NAV_SECTIONS: NavSection[] = [
  {
    items: [
      { label: 'Dashboard', path: ROUTES.DASHBOARD, icon: LayoutDashboard },
    ],
  },
  {
    title: 'GESTIÓN',
    items: [
      { label: 'Clientes', path: ROUTES.CLIENTES, icon: Users },
      { label: 'Órdenes de Trabajo', path: ROUTES.ORDENES, icon: ClipboardList },
      { label: 'Recursos e Inventario', path: ROUTES.INVENTARIO, icon: Package },
      { label: 'Operaciones en Terreno', path: ROUTES.OPERACIONES, icon: MapPin },
      { label: 'Facturación', path: ROUTES.FACTURACION, icon: FileText },
      { label: 'Reportes', path: ROUTES.REPORTES, icon: BarChart3 },
    ],
  },
  {
    title: 'ADMINISTRACIÓN',
    items: [
      { label: 'Usuarios y Roles', path: ROUTES.USUARIOS, icon: UserCog },
      { label: 'Parámetros', path: ROUTES.PARAMETROS, icon: Settings2 },
      { label: 'Configuración', path: ROUTES.CONFIGURACION, icon: Settings },
    ],
  },
]

export const SUPPORT_ITEM = {
  label: 'Soporte',
  path: ROUTES.SOPORTE,
  icon: Headphones,
}
