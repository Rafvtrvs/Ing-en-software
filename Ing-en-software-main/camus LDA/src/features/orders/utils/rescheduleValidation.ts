import { mockEquipment } from '@/data/mock/equipment'
import type { Equipment, Product, WorkOrder } from '@/types'

export interface RescheduleValidationResult {
  available: boolean
  reasons: string[]
}

/** RF66 CDS 228 — validación mock de insumos y maquinaria */
export function validateRescheduleDate(
  order: WorkOrder,
  newDate: string,
  orders: WorkOrder[],
  products: Product[],
): RescheduleValidationResult {
  const reasons: string[] = []

  if (!newDate) {
    return { available: false, reasons: ['Debe seleccionar una fecha válida.'] }
  }

  const equipment = resolveOrderEquipment(order)
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

  const criticalProducts = products.filter((p) => p.status === 'Crítico')
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

function resolveOrderEquipment(order: WorkOrder): Equipment | undefined {
  if (!order.equipmentId) {
    const byOrder = mockEquipment.find((e) => e.assignedOrderId === order.id)
    return byOrder
  }
  return mockEquipment.find((e) => e.id === order.equipmentId)
}
