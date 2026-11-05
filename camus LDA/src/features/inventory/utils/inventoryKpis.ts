import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Boxes,
  Package,
} from 'lucide-react'
import type { Equipment, KpiData, Product, StockMovement } from '@/types'
import { isConsumableStockCategory } from '@/features/inventory/utils/stockCategories'

function parseMovementDate(dateStr: string): Date | null {
  const trimmed = dateStr.trim()
  const dmy = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/)
  if (dmy) {
    const day = Number(dmy[1])
    const month = Number(dmy[2])
    const year = Number(dmy[3])
    const d = new Date(year, month - 1, day)
    return Number.isNaN(d.getTime()) ? null : d
  }

  const normalized = trimmed.replace(',', '')
  const parsed = new Date(normalized)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function isMovementInCurrentMonth(movement: StockMovement, now = new Date()): boolean {
  if (movement.createdAt) {
    const d = new Date(movement.createdAt)
    if (!Number.isNaN(d.getTime())) {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    }
  }
  const d = parseMovementDate(movement.date)
  if (!d) return false
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
}

export function getInventoryKpis(
  products: Product[],
  movements: StockMovement[] = [],
  equipment: Equipment[] = [],
): KpiData[] {
  const consumables = products.filter((p) => isConsumableStockCategory(p.category))
  const totalProducts = products.length
  const totalUnits = consumables.reduce((s, p) => s + p.currentStock, 0)
  const alertCount = consumables.filter(
    (p) => p.status === 'Crítico' || p.status === 'Bajo',
  ).length

  const monthMovements = movements.filter((m) => isMovementInCurrentMonth(m))
  const entries = monthMovements
    .filter((m) => m.type === 'Entrada')
    .reduce((s, m) => s + Math.abs(m.quantity), 0)
  const exits = monthMovements
    .filter((m) => m.type === 'Salida')
    .reduce((s, m) => s + Math.abs(m.quantity), 0)

  const operativeEquipment = equipment.filter((e) => e.status === 'Operativo').length

  return [
    {
      title: 'Total Productos',
      value: String(totalProducts),
      trend: `${consumables.length} consumibles en catálogo`,
      trendDirection: 'up',
      icon: Package,
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
    },
    {
      title: 'Stock Total (Unidades)',
      value: totalUnits.toLocaleString('es-CL'),
      trend: 'Unidades de insumos en bodega',
      trendDirection: 'up',
      icon: Boxes,
      iconBg: 'bg-violet-50',
      iconColor: 'text-violet-600',
    },
    {
      title: 'Alertas de Stock',
      value: String(alertCount),
      trend: alertCount > 0 ? 'Crítico o bajo — revisar' : 'Sin alertas activas',
      trendDirection: alertCount > 0 ? 'down' : 'up',
      icon: AlertTriangle,
      iconBg: alertCount > 0 ? 'bg-red-50' : 'bg-emerald-50',
      iconColor: alertCount > 0 ? 'text-red-600' : 'text-emerald-600',
    },
    {
      title: 'Entradas del Mes',
      value: entries.toLocaleString('es-CL'),
      trend:
        equipment.length > 0
          ? `${operativeEquipment}/${equipment.length} equipos operativos`
          : 'Unidades ingresadas este mes',
      trendDirection: 'up',
      icon: ArrowDownToLine,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
    },
    {
      title: 'Salidas del Mes',
      value: exits.toLocaleString('es-CL'),
      trend: 'Uso en OT y egresos de bodega',
      trendDirection: exits > 0 ? 'down' : 'up',
      icon: ArrowUpFromLine,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
    },
  ]
}
