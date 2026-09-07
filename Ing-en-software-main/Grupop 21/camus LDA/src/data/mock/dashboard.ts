import { ClipboardList, CheckCircle, Clock, DollarSign } from 'lucide-react'
import type { ChartDataPoint, InventoryItem, KpiData, WorkOrder } from '@/types'

export const dashboardKpis: KpiData[] = [
  {
    title: 'Órdenes Totales',
    value: '128',
    trend: '+15% vs mes anterior',
    trendDirection: 'up',
    icon: ClipboardList,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
  },
  {
    title: 'Órdenes Completadas',
    value: '96',
    trend: '+20% vs mes anterior',
    trendDirection: 'up',
    icon: CheckCircle,
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
  },
  {
    title: 'Órdenes Pendientes',
    value: '32',
    trend: '-5% vs mes anterior',
    trendDirection: 'down',
    icon: Clock,
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
  },
  {
    title: 'Ingresos del Mes',
    value: '$24.580.000',
    trend: '+18% vs mes anterior',
    trendDirection: 'up',
    icon: DollarSign,
    iconBg: 'bg-violet-50',
    iconColor: 'text-violet-600',
  },
]

export const ordersByStatus: ChartDataPoint[] = [
  { name: 'Pendiente', value: 32, color: '#3b82f6' },
  { name: 'En Curso', value: 48, color: '#eab308' },
  { name: 'Completada', value: 40, color: '#22c55e' },
  { name: 'Cancelada', value: 8, color: '#94a3b8' },
]

export const ordersByMonth = [
  { month: 'Dic', orders: 72 },
  { month: 'Ene', orders: 85 },
  { month: 'Feb', orders: 91 },
  { month: 'Mar', orders: 102 },
  { month: 'Abr', orders: 115 },
  { month: 'May', orders: 128 },
]

export const ordersByCategory: ChartDataPoint[] = [
  { name: 'Obstrucción', value: 40 },
  { name: 'Rotura de Tubería', value: 28 },
  { name: 'Rebalse', value: 20 },
  { name: 'Mantención', value: 18 },
  { name: 'Otros', value: 12 },
]

export const recentOrders: WorkOrder[] = [
  {
    id: 'OT-2026-0128',
    client: 'Comercial XYZ Ltda.',
    address: 'Av. Providencia 1234',
    category: 'Obstrucción',
    status: 'En Curso',
    createdAt: '22/05/2026',
  },
  {
    id: 'OT-2026-0127',
    client: 'Inversiones SpA',
    address: 'Los Leones 567',
    category: 'Rotura de Tubería',
    status: 'Pendiente',
    createdAt: '22/05/2026',
  },
  {
    id: 'OT-2026-0126',
    client: 'Constructora ABC',
    address: 'Apoquindo 2890',
    category: 'Rebalse',
    status: 'Completada',
    createdAt: '21/05/2026',
  },
  {
    id: 'OT-2026-0125',
    client: 'Aguas Claras Ltda.',
    address: 'El Bosque 445',
    category: 'Mantención',
    status: 'En Curso',
    createdAt: '21/05/2026',
  },
  {
    id: 'OT-2026-0124',
    client: 'Edificio Central',
    address: 'Moneda 980',
    category: 'Obstrucción',
    status: 'Pendiente',
    createdAt: '20/05/2026',
  },
]

export const criticalInventory: InventoryItem[] = [
  { product: 'Tubería PVC 110mm', currentStock: 12, minStock: 50, status: 'Crítico' },
  { product: 'Codo PVC 90°', currentStock: 28, minStock: 40, status: 'Bajo' },
  { product: 'Sello hidráulico', currentStock: 85, minStock: 30, status: 'Ok' },
  { product: 'Bomba sumergible', currentStock: 3, minStock: 5, status: 'Crítico' },
  { product: 'Manguera flexible', currentStock: 22, minStock: 25, status: 'Bajo' },
]

export const quickActions = [
  { label: 'Nueva Orden', path: '/ordenes/nueva' },
  { label: 'Nuevo Cliente', path: '/clientes/nuevo' },
  { label: 'Ver Calendario', path: '/operaciones' },
  { label: 'Reporte de Órdenes', path: '/reportes' },
  { label: 'Inventario', path: '/inventario' },
  { label: 'Usuarios', path: '/usuarios' },
]
