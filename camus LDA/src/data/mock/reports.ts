import { BarChart3, ClipboardList } from 'lucide-react'
import type { KpiData, ReportExportItem } from '@/types'

export const reportExportCatalog: ReportExportItem[] = [
  {
    id: 'exp-1',
    title: 'Órdenes de Trabajo',
    description: 'Listado completo con estado, cliente y técnico asignado.',
    category: 'ordenes',
    format: 'CSV',
  },
  {
    id: 'exp-1x',
    title: 'Órdenes de Trabajo (Excel)',
    description: 'Mismo listado en formato Excel (.xlsx).',
    category: 'ordenes',
    format: 'XLSX',
  },
  {
    id: 'exp-2',
    title: 'Facturas Emitidas',
    description: 'Detalle de facturación, montos y fechas de vencimiento.',
    category: 'facturacion',
    format: 'CSV',
  },
  {
    id: 'exp-2x',
    title: 'Facturas Emitidas (Excel)',
    description: 'Facturación en Excel (.xlsx).',
    category: 'facturacion',
    format: 'XLSX',
  },
  {
    id: 'exp-3',
    title: 'Inventario Actual',
    description: 'Stock, mínimos y estado de cada producto.',
    category: 'inventario',
    format: 'CSV',
  },
  {
    id: 'exp-3x',
    title: 'Inventario Actual (Excel)',
    description: 'Inventario en Excel (.xlsx).',
    category: 'inventario',
    format: 'XLSX',
  },
  {
    id: 'exp-4',
    title: 'Rendimiento de Técnicos',
    description: 'Órdenes completadas, tiempos e índice de cierre desde Postgres.',
    category: 'tecnicos',
    format: 'CSV',
  },
  {
    id: 'exp-4x',
    title: 'Rendimiento de Técnicos (Excel)',
    description: 'Rendimiento técnico desde OT y usuarios reales (.xlsx).',
    category: 'tecnicos',
    format: 'XLSX',
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
  {
    id: 'exp-6x',
    title: 'Clientes Activos (Excel)',
    description: 'Clientes en Excel (.xlsx).',
    category: 'resumen',
    format: 'XLSX',
  },
  {
    id: 'exp-7',
    title: 'Reporte de Costos Operacionales',
    description: 'Costos estimados por período (mano de obra, combustible, overhead).',
    category: 'costos',
    format: 'PDF',
  },
  {
    id: 'exp-8',
    title: 'Informe de Uso de Activos Físicos',
    description: 'Servicios y órdenes donde operó cada máquina o camión.',
    category: 'activos',
    format: 'PDF',
  },
]

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
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
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
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
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

