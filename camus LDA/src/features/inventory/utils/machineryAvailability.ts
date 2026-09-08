import type { Equipment, MachineryAvailabilityStatus, WorkOrder } from '@/types'

export interface MachineryAvailabilityRow {
  equipment: Equipment
  availability: MachineryAvailabilityStatus
  assignment: string
  reason?: string
  lastInfo: string
}

/** RF67 CDS 232 — determina disponibilidad según asignación y mantenimiento */
export function determineMachineryAvailability(
  equipment: Equipment,
  orders: WorkOrder[],
): MachineryAvailabilityRow {
  if (equipment.status === 'Mantenimiento') {
    return {
      equipment,
      availability: 'No disponible',
      assignment: equipment.assignedTo ?? '—',
      reason: 'Mantenimiento',
      lastInfo: equipment.nextMaintenance,
    }
  }
  if (equipment.status === 'Fuera de servicio') {
    return {
      equipment,
      availability: 'No disponible',
      assignment: '—',
      reason: 'Fuera de servicio',
      lastInfo: equipment.lastMaintenance,
    }
  }
  if (equipment.status === 'Asignado' || equipment.assignedOrderId) {
    const order = orders.find(
      (o) =>
        o.id === equipment.assignedOrderId ||
        (o.equipmentId === equipment.id &&
          (o.status === 'Pendiente' || o.status === 'En Curso')),
    )
    return {
      equipment,
      availability: 'En uso',
      assignment: order ? order.id : (equipment.assignedOrderId ?? equipment.assignedTo ?? '—'),
      lastInfo: equipment.nextMaintenance,
    }
  }
  return {
    equipment,
    availability: 'Disponible',
    assignment: 'Sin asignación activa',
    lastInfo: equipment.nextMaintenance,
  }
}

export function filterByAvailabilityStatus(
  rows: MachineryAvailabilityRow[],
  filter: MachineryAvailabilityStatus | 'all',
): MachineryAvailabilityRow[] {
  if (filter === 'all') return rows
  return rows.filter((r) => r.availability === filter)
}
