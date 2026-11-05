import type { Equipment, Product, WorkOrder } from '@/types'
import { isConsumableStockCategory } from '@/features/inventory/utils/stockCategories'

export interface RescheduleValidationResult {
  available: boolean
  reasons: string[]
}

/** RF66 CDS 228 — validación de insumos y maquinaria (datos reales) */
export function validateRescheduleDate(
  order: WorkOrder,
  newDate: string,
  orders: WorkOrder[],
  products: Product[],
  equipmentList: Equipment[] = [],
): RescheduleValidationResult {
  const reasons: string[] = []

  if (!newDate) {
    return { available: false, reasons: ['Debe seleccionar una fecha válida.'] }
  }

  const equipment = resolveOrderEquipment(order, equipmentList)
  if (equipment) {
    if (equipment.status === 'Mantenimiento') {
      reasons.push(`Maquinaria ${equipment.code} en mantenimiento.`)
    }
    if (equipment.status === 'Fuera de servicio') {
      reasons.push(`Maquinaria ${equipment.code} fuera de servicio.`)
    }
    const conflict = orders.find(
      (o) =>
        o.id !== order.id &&
        o.equipmentId === equipment.id &&
        (o.status === 'Pendiente' || o.status === 'En Curso') &&
        getExecutionDate(o) === newDate,
    )
    if (conflict) {
      reasons.push(`Maquinaria ${equipment.code} asignada a ${conflict.id} en esa fecha.`)
    }
  }

  const criticalProducts = products.filter(
    (p) => isConsumableStockCategory(p.category) && p.status === 'Crítico',
  )
  if (order.suppliesUsed?.length) {
    const usedCritical = order.suppliesUsed.some((s) =>
      criticalProducts.some((p) => p.id === s.productId),
    )
    if (usedCritical) {
      reasons.push('Insumos críticos insuficientes para la fecha seleccionada.')
    }
  } else if (criticalProducts.length >= 3) {
    reasons.push('Stock crítico en insumos frecuentes; verificar disponibilidad.')
  }

  return { available: reasons.length === 0, reasons }
}

export function getExecutionDate(order: WorkOrder): string {
  if (order.executionDate) return order.executionDate.slice(0, 10)
  if (order.startDate) return order.startDate.slice(0, 10)
  return ''
}

function resolveOrderEquipment(
  order: WorkOrder,
  equipmentList: Equipment[],
): Equipment | undefined {
  if (!order.equipmentId) {
    return equipmentList.find((e) => e.assignedOrderId === order.id)
  }
  return equipmentList.find((e) => e.id === order.equipmentId)
}
