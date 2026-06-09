import { MapPin, Radio, Timer, Truck, Users } from 'lucide-react'
import type {
  FieldActiveOrder,
  FieldAlert,
  FieldScheduleItem,
  FieldTechnician,
  KpiData,
} from '@/types'

export const fieldTechnicians: FieldTechnician[] = [
  {
    id: 't1',
    name: 'Luis Torres',
    status: 'En Curso',
    address: 'Av. Las Torres 1234',
    orderId: 'OT-2026-0128',
    progress: 65,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Luis',
  },
  {
    id: 't2',
    name: 'Ana Pérez',
    status: 'En Ruta',
    address: 'Camino a Melipilla 456',
    orderId: 'OT-2026-0127',
    progress: 30,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ana',
  },
  {
    id: 't3',
    name: 'Miguel Silva',
    status: 'Completada',
    address: 'Pte. Salvador 789',
    orderId: 'OT-2026-0126',
    progress: 100,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Miguel',
  },
  {
    id: 't4',
    name: 'Carlos Rojas',
    status: 'En Espera',
    address: 'Av. Kennedy 2000',
    orderId: 'OT-2026-0125',
    progress: 10,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos',
  },
]

export const fieldAlerts: FieldAlert[] = [
  {
    id: 'a1',
    type: 'error',
    title: 'Operación retrasada',
    description: 'OT-2026-0125 superó el tiempo estimado de llegada.',
    time: 'hace 15 min',
  },
  {
    id: 'a2',
    type: 'warning',
    title: 'Stock bajo en terreno',
    description: 'Tubería PVC 110mm por debajo del mínimo en vehículo 3.',
    time: 'hace 45 min',
  },
  {
    id: 'a3',
    type: 'info',
    title: 'Nueva orden asignada',
    description: 'OT-2026-0129 asignada a Luis Torres.',
    time: 'hace 1 h',
  },
  {
    id: 'a4',
    type: 'success',
    title: 'Operación completada',
    description: 'Miguel Silva finalizó OT-2026-0126.',
    time: 'hace 2 h',
  },
]

export const fieldSchedule: FieldScheduleItem[] = [
  {
    id: 's1',
    start: '08:00',
    end: '10:00',
    orderId: 'OT-2026-0120',
    service: 'Inspección de red',
    address: 'Los Aromos 450',
    status: 'Completada',
  },
  {
    id: 's2',
    start: '10:30',
    end: '12:30',
    orderId: 'OT-2026-0127',
    service: 'Rotura de tubería',
    address: 'Camino a Melipilla 456',
    status: 'En Curso',
  },
  {
    id: 's3',
    start: '14:00',
    end: '16:00',
    orderId: 'OT-2026-0128',
    service: 'Desobstrucción',
    address: 'Av. Las Torres 1234',
    status: 'En Curso',
  },
]

export const fieldActiveOrders: FieldActiveOrder[] = [
  {
    id: 'OT-2026-0128',
    client: 'Comercial XYZ Ltda.',
    service: 'Desobstrucción alcantarillado',
    technician: 'Luis Torres',
    status: 'En Curso',
    progress: 65,
  },
  {
    id: 'OT-2026-0127',
    client: 'Inversiones SpA',
    service: 'Rotura de tubería',
    technician: 'Ana Pérez',
    status: 'En Ruta',
    progress: 30,
  },
  {
    id: 'OT-2026-0125',
    client: 'Aguas Claras Ltda.',
    service: 'Control de rebalse',
    technician: 'Carlos Rojas',
    status: 'Retrasada',
    progress: 10,
  },
]

export function getOperationsKpis(): KpiData[] {
  return [
    {
      title: 'Técnicos en Terreno',
      value: '18',
      trend: '+12% vs ayer',
      trendDirection: 'up',
      icon: Users,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Operaciones Activas',
      value: '24',
      trend: '+8% vs ayer',
      trendDirection: 'up',
      icon: Radio,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
    },
    {
      title: 'Operaciones Completadas',
      value: '32',
      trend: '+15% vs ayer',
      trendDirection: 'up',
      icon: Truck,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
    },
    {
      title: 'En Espera / Retrasadas',
      value: '6',
      trend: '-10% vs ayer',
      trendDirection: 'down',
      icon: Timer,
      iconBg: 'bg-violet-50',
      iconColor: 'text-violet-600',
    },
    {
      title: 'Cobertura del Día',
      value: '92%',
      trend: '+5% vs ayer',
      trendDirection: 'up',
      icon: MapPin,
      iconBg: 'bg-teal-50',
      iconColor: 'text-teal-600',
    },
  ]
}
