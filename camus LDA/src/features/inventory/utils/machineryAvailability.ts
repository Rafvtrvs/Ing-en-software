import type { Equipment, MachineryAvailabilityStatus, WorkOrder } from '@/types'

export interface MachineryAvailabilityRow {
  equipment: Equipment
  availability: MachineryAvailabilityStatus
  assignment: string
  reason?: string
  lastInfo: string
}

function findActiveAssignment(
  equipment: Equipment,
  orders: WorkOrder[],
): WorkOrder | undefined {
  return orders.find((o) => {
    if (o.status !== 'Pendiente' && o.status !== 'En Curso') return false
    if (equipment.assignedOrderId && o.id === equipment.assignedOrderId) return true
    if (o.equipmentId && o.equipmentId === equipment.id) return true
    if (o.truckCode && o.truckCode === equipment.code) return true
    return false
  })
}

/** RF67 CDS 232 — determina disponibilidad según asignación real y mantenimiento */
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

  const order = findActiveAssignment(equipment, orders)
  if (order || equipment.status === 'Asignado' || equipment.assignedOrderId) {
    return {
      equipment,
      availability: 'En uso',
      assignment:
        order?.id ??
        equipment.assignedOrderId ??
        equipment.assignedTo ??
        '—',
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
