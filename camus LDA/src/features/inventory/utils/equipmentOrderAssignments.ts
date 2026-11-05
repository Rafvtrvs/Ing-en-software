import type { Equipment, WorkOrder } from '@/types'

const ACTIVE: ReadonlySet<WorkOrder['status']> = new Set(['Pendiente', 'En Curso'])

/** Construye las asignaciones activas equipo↔OT a partir de las órdenes. */
export function buildActiveEquipmentAssignments(
  orders: WorkOrder[],
  equipment: Equipment[],
): Array<{ code: string; orderId: string; address: string }> {
  const byId = new Map(equipment.map((e) => [e.id, e]))
  const byCode = new Map(equipment.map((e) => [e.code.trim().toUpperCase(), e]))
  const result: Array<{ code: string; orderId: string; address: string }> = []
  const seen = new Set<string>()

  for (const order of orders) {
    if (!ACTIVE.has(order.status)) continue

    const candidates: Equipment[] = []
    if (order.equipmentId && byId.has(order.equipmentId)) {
      candidates.push(byId.get(order.equipmentId)!)
    }
    if (order.truckCode) {
      const byTruck = byCode.get(order.truckCode.trim().toUpperCase())
      if (byTruck) candidates.push(byTruck)
    }

    for (const eq of candidates) {
      const key = eq.code.trim().toUpperCase()
      if (seen.has(key)) continue
      seen.add(key)
      result.push({
        code: eq.code,
        orderId: order.id,
        address: order.address || 'Sin dirección',
      })
    }
  }

  return result
}
