import {
  AlertTriangle,
  Boxes,
  DollarSign,
  Package,
  TrendingDown,
} from 'lucide-react'
import type { KpiData, Product, StockMovement } from '@/types'
import { computeStockStatus } from '@/features/inventory/utils/inventoryStatus'

export const initialProducts: Product[] = [
  {
    id: '1',
    code: 'PVC-110-001',
    name: 'Tubería PVC 110mm',
    category: 'Tuberías',
    currentStock: 12,
    minStock: 50,
    unit: 'm',
    status: 'Crítico',
  },
  {
    id: '2',
    code: 'CODO-90-002',
    name: 'Codo PVC 90°',
    category: 'Accesorios',
    currentStock: 28,
    minStock: 40,
    unit: 'un',
    status: 'Bajo',
  },
  {
    id: '3',
    code: 'SELLO-003',
    name: 'Sello hidráulico',
    category: 'Sellos',
    currentStock: 85,
    minStock: 30,
    unit: 'un',
    status: 'Ok',
  },
  {
    id: '4',
    code: 'BOMBA-004',
    name: 'Bomba sumergible',
    category: 'Equipos',
    currentStock: 3,
    minStock: 5,
    unit: 'un',
    status: 'Crítico',
  },
  {
    id: '5',
    code: 'MANG-005',
    name: 'Manguera flexible',
    category: 'Mangueras',
    currentStock: 22,
    minStock: 25,
    unit: 'm',
    status: 'Bajo',
  },
  {
    id: '6',
    code: 'VALV-006',
    name: 'Válvula check 50mm',
    category: 'Válvulas',
    currentStock: 45,
    minStock: 20,
    unit: 'un',
    status: 'Ok',
  },
  {
    id: '7',
    code: 'CEM-007',
    name: 'Cemento hidráulico',
    category: 'Insumos',
    currentStock: 120,
    minStock: 40,
    unit: 'kg',
    status: 'Ok',
  },
  {
    id: '8',
    code: 'BRID-008',
    name: 'Brida acero 100mm',
    category: 'Accesorios',
    currentStock: 8,
    minStock: 15,
    unit: 'un',
    status: 'Bajo',
  },
].map((p) => ({
  ...p,
  status: computeStockStatus(p.currentStock, p.minStock),
}))

export const initialMovements: StockMovement[] = [
  {
    id: 'm1',
    date: '22/05/2026',
    type: 'Salida',
    productId: '1',
    product: 'Tubería PVC 110mm',
    detail: 'OT-2026-0128',
    quantity: -15,
    user: 'Luis Torres',
  },
  {
    id: 'm2',
    date: '22/05/2026',
    type: 'Entrada',
    productId: '3',
    product: 'Sello hidráulico',
    detail: 'Compra proveedor',
    quantity: 50,
    user: 'Ana Pérez',
  },
  {
    id: 'm3',
    date: '21/05/2026',
    type: 'Salida',
    productId: '4',
    product: 'Bomba sumergible',
    detail: 'OT-2026-0126',
    quantity: -1,
    user: 'Miguel Silva',
  },
  {
    id: 'm4',
    date: '21/05/2026',
    type: 'Entrada',
    productId: '1',
    product: 'Tubería PVC 110mm',
    detail: 'Reposición stock',
    quantity: 100,
    user: 'Carlos Rojas',
  },
]

export const mostUsedProducts = [
  { name: 'Tubería PVC 110mm', value: 450, unit: 'm' },
  { name: 'Codo PVC 90°', value: 280, unit: 'un' },
  { name: 'Sello hidráulico', value: 195, unit: 'un' },
  { name: 'Manguera flexible', value: 160, unit: 'm' },
  { name: 'Cemento hidráulico', value: 120, unit: 'kg' },
]

export function getInventoryKpis(products: Product[]): KpiData[] {
  const totalProducts = products.length
  const totalUnits = products.reduce((s, p) => s + p.currentStock, 0)
  const critical = products.filter((p) => p.status === 'Crítico').length

  return [
    {
      title: 'Total Productos',
      value: String(totalProducts),
      trend: '+12% vs mes anterior',
      trendDirection: 'up',
      icon: Package,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Stock Total (Unidades)',
      value: totalUnits.toLocaleString('es-CL'),
      trend: '+8% vs mes anterior',
      trendDirection: 'up',
      icon: Boxes,
      iconBg: 'bg-violet-50',
      iconColor: 'text-violet-600',
    },
    {
      title: 'Productos Críticos',
      value: String(critical),
      trend: '-5% vs mes anterior',
      trendDirection: 'down',
      icon: AlertTriangle,
      iconBg: 'bg-red-50',
      iconColor: 'text-red-600',
    },
    {
      title: 'Ingresos del Mes',
      value: '$24.580.000',
      trend: '+18% vs mes anterior',
      trendDirection: 'up',
      icon: DollarSign,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
    },
    {
      title: 'Egresos del Mes',
      value: '$16.230.000',
      trend: '+10% vs mes anterior',
      trendDirection: 'up',
      icon: TrendingDown,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
    },
  ]
}
