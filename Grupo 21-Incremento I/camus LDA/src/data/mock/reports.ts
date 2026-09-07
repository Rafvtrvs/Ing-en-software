import {
  BarChart3,
  ClipboardList,
  DollarSign,
  Package,
  Users,
} from 'lucide-react'
import type {
  ChartDataPoint,
  KpiData,
  ReportExportItem,
  TechnicianPerformance,
} from '@/types'

export const revenueByMonth = [
  { month: 'Dic', revenue: 18200000 },
  { month: 'Ene', revenue: 21500000 },
  { month: 'Feb', revenue: 19800000 },
  { month: 'Mar', revenue: 24100000 },
  { month: 'Abr', revenue: 26800000 },
  { month: 'May', revenue: 24580000 },
]

export const technicianPerformance: TechnicianPerformance[] = [
  {
    id: 't1',
    name: 'Luis Torres',
    completedOrders: 28,
    inProgress: 3,
    avgCompletionDays: 2.1,
    rating: 4.8,
  },
  {
    id: 't2',
    name: 'Ana Pérez',
    completedOrders: 24,
    inProgress: 2,
    avgCompletionDays: 2.4,
    rating: 4.6,
  },
  {
    id: 't3',
    name: 'Miguel Silva',
    completedOrders: 31,
    inProgress: 1,
    avgCompletionDays: 1.9,
    rating: 4.9,
  },
  {
    id: 't4',
    name: 'Carlos Rojas',
    completedOrders: 19,
    inProgress: 4,
    avgCompletionDays: 2.8,
    rating: 4.3,
  },
  {
    id: 't5',
    name: 'Patricia Muñoz',
    completedOrders: 22,
    inProgress: 2,
    avgCompletionDays: 2.2,
    rating: 4.7,
  },
]

export const reportExportCatalog: ReportExportItem[] = [
  {
    id: 'exp-1',
    title: 'Órdenes de Trabajo',
    description: 'Listado completo con estado, cliente y técnico asignado.',
    category: 'ordenes',
    format: 'CSV',
  },
  {
    id: 'exp-2',
    title: 'Facturas Emitidas',
    description: 'Detalle de facturación, montos y fechas de vencimiento.',
    category: 'facturacion',
    format: 'CSV',
  },
  {
    id: 'exp-3',
    title: 'Inventario Actual',
    description: 'Stock, mínimos y estado de cada producto.',
    category: 'inventario',
    format: 'CSV',
  },
  {
    id: 'exp-4',
    title: 'Rendimiento de Técnicos',
    description: 'Órdenes completadas, tiempos y calificación promedio.',
    category: 'tecnicos',
    format: 'CSV',
  },
  {
    id: 'exp-5',
    title: 'Resumen Ejecutivo',
    description: 'KPIs consolidados del período seleccionado.',
    category: 'resumen',
    format: 'PDF',
  },
  {
    id: 'exp-6',
    title: 'Clientes Activos',
    description: 'Base de clientes con última orden y estado.',
    category: 'resumen',
    format: 'CSV',
  },
]

export function getSummaryReportKpis(stats: {
  totalOrders: number
  completedOrders: number
  totalRevenue: number
  criticalProducts: number
  activeClients: number
}): KpiData[] {
  const completionRate = stats.totalOrders
    ? Math.round((stats.completedOrders / stats.totalOrders) * 100)
    : 0

  return [
    {
      title: 'Órdenes Totales',
      value: String(stats.totalOrders),
      trend: `${completionRate}% completadas`,
      trendDirection: completionRate >= 70 ? 'up' : 'down',
      icon: ClipboardList,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Ingresos Facturados',
      value: formatKpiMoney(stats.totalRevenue),
      trend: '+18% vs período anterior',
      trendDirection: 'up',
      icon: DollarSign,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
    },
    {
      title: 'Clientes Activos',
      value: String(stats.activeClients),
      trend: 'Con actividad reciente',
      trendDirection: 'up',
      icon: Users,
      iconBg: 'bg-violet-50',
      iconColor: 'text-violet-600',
    },
    {
      title: 'Alertas Inventario',
      value: String(stats.criticalProducts),
      trend: stats.criticalProducts > 0 ? 'Requiere reposición' : 'Stock estable',
      trendDirection: stats.criticalProducts > 0 ? 'down' : 'up',
      icon: Package,
      iconBg: stats.criticalProducts > 0 ? 'bg-red-50' : 'bg-emerald-50',
      iconColor: stats.criticalProducts > 0 ? 'text-red-600' : 'text-emerald-600',
    },
  ]
}

export function getOrdersReportKpis(stats: {
  total: number
  pending: number
  inProgress: number
  completed: number
}): KpiData[] {
  return [
    {
      title: 'Total Órdenes',
      value: String(stats.total),
      trend: 'En el período',
      trendDirection: 'up',
      icon: ClipboardList,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Pendientes',
      value: String(stats.pending),
      trend: `${stats.total ? Math.round((stats.pending / stats.total) * 100) : 0}% del total`,
      trendDirection: 'down',
      icon: BarChart3,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
    },
    {
      title: 'En Curso',
      value: String(stats.inProgress),
      trend: 'Activas ahora',
      trendDirection: 'up',
      icon: BarChart3,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Completadas',
      value: String(stats.completed),
      trend: `${stats.total ? Math.round((stats.completed / stats.total) * 100) : 0}% del total`,
      trendDirection: 'up',
      icon: ClipboardList,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
    },
  ]
}

function formatKpiMoney(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1000) return `$${Math.round(value / 1000)}K`
  return `$${value}`
}

export function ordersTrendByMonth(): { month: string; orders: number }[] {
  return [
    { month: 'Dic', orders: 72 },
    { month: 'Ene', orders: 85 },
    { month: 'Feb', orders: 91 },
    { month: 'Mar', orders: 102 },
    { month: 'Abr', orders: 115 },
    { month: 'May', orders: 128 },
  ]
}

export function topClientsByOrders(): ChartDataPoint[] {
  return [
    { name: 'Municipalidad Lo Barnechea', value: 18 },
    { name: 'Constructora ABC', value: 14 },
    { name: 'Comercial XYZ Ltda.', value: 12 },
    { name: 'Aguas Claras Ltda.', value: 9 },
    { name: 'Edificio Central', value: 7 },
  ]
}
