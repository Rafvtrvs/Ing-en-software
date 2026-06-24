import {
  Ban,
  CheckCircle,
  ClipboardList,
  Clock,
  LoaderCircle,
} from 'lucide-react'
import type { KpiData, WorkOrder } from '@/types'

export const ordersKpis = (orders: WorkOrder[]): KpiData[] => {
  const total = orders.length
  const pending = orders.filter((o) => o.status === 'Pendiente').length
  const inProgress = orders.filter((o) => o.status === 'En Curso').length
  const completed = orders.filter((o) => o.status === 'Completada').length
  const canceled = orders.filter((o) => o.status === 'Cancelada').length

  return [
    {
      title: 'Total Órdenes',
      value: String(total),
      trend: '+15% vs mes anterior',
      trendDirection: 'up',
      icon: ClipboardList,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Pendientes',
      value: String(pending),
      trend: '-5% vs mes anterior',
      trendDirection: 'down',
      icon: Clock,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
    },
    {
      title: 'En Curso',
      value: String(inProgress),
      trend: '+10% vs mes anterior',
      trendDirection: 'up',
      icon: LoaderCircle,
      iconBg: 'bg-violet-50',
      iconColor: 'text-violet-600',
    },
    {
      title: 'Completadas',
      value: String(completed),
      trend: '+20% vs mes anterior',
      trendDirection: 'up',
      icon: CheckCircle,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
    },
    {
      title: 'Canceladas',
      value: String(canceled),
      trend: '+10% vs mes anterior',
      trendDirection: 'up',
      icon: Ban,
      iconBg: 'bg-slate-100',
      iconColor: 'text-slate-600',
    },
  ]
}

export const initialOrders: WorkOrder[] = [
  {
    id: 'OT-2026-0128',
    client: 'Carlos Mendoza',
    address: 'Av. Las Torres 1234',
    service: 'Obstrucción de cámara',
    category: 'Obstrucción',
    status: 'Pendiente',
    createdAt: '22/05/2026',
    priority: 'Alta',
    technician: 'Luis Torres',
    progress: 0,
    equipmentId: 'eq-3',
    truckCode: 'CAM-009',
  },
  {
    id: 'OT-2026-0127',
    client: 'Inversiones SpA',
    address: 'Camino a Melipilla 456',
    service: 'Rotura de tubería matriz',
    category: 'Rotura de Tubería',
    status: 'En Curso',
    createdAt: '22/05/2026',
    priority: 'Media',
    technician: 'Ana Pérez',
    progress: 60,
    equipmentId: 'eq-2',
    truckCode: 'CAM-012',
  },
  {
    id: 'OT-2026-0126',
    client: 'Comercial XYZ Ltda.',
    address: 'Pte. Salvador 789',
    service: 'Mantención preventiva',
    category: 'Mantención',
    status: 'Completada',
    createdAt: '21/05/2026',
    priority: 'Baja',
    technician: 'Miguel Silva',
    progress: 100,
  },
  {
    id: 'OT-2026-0119',
    client: 'Servicios Rojas',
    address: 'Av. Kennedy 2000',
    service: 'Limpieza de colector',
    category: 'Rebalse',
    status: 'Cancelada',
    createdAt: '20/05/2026',
    priority: 'Media',
    technician: 'Jorge Herrera',
    progress: 0,
  },
  {
    id: 'OT-2026-0124',
    client: 'Constructora ABC',
    address: 'Av. Libertad 123',
    service: 'Desobstrucción de ducto',
    category: 'Obstrucción',
    status: 'En Curso',
    createdAt: '20/05/2026',
    priority: 'Alta',
    technician: 'Daniela Soto',
    progress: 35,
    truckCode: 'CAM-009',
  },
]

