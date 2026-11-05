import type { AppRole, SystemUser, TechnicianPerformance, WorkOrder } from '@/types'
import { getActiveFieldOperators } from '@/features/operations/utils/fieldTechnicians'
import { calcDurationHours } from '@/features/orders/utils/orderDates'

function isAssignedToOperator(order: WorkOrder, opId: string, opName: string): boolean {
  if (order.operatorIds?.includes(opId)) return true
  if (order.operators?.some((o) => o.id === opId || o.name === opName)) return true
  if (order.technician?.trim() === opName) return true
  return false
}

function isCompleted(order: WorkOrder): boolean {
  return order.status === 'Completada' || order.status === 'Abonado'
}

function isInProgress(order: WorkOrder): boolean {
  return order.status === 'En Curso'
}

/** Días de ciclo de una OT (duración real o fechas de inicio/fin). */
function orderCycleDays(order: WorkOrder): number | null {
  if (order.durationHours != null && order.durationHours > 0) {
    return Math.round((order.durationHours / 24) * 10) / 10
  }
  const start =
    order.serviceStartedAt || order.startDate || order.createdAt || null
  const end = order.serviceEndedAt || order.endDate || order.dueDate || null
  const hours = calcDurationHours(start, end)
  if (hours == null || hours < 0) return null
  return Math.round((hours / 24) * 10) / 10
}

/**
 * Rendimiento de técnicos/operadores activos a partir de usuarios y OT de Postgres.
 */
export function buildTechnicianPerformance(
  users: SystemUser[],
  roles: AppRole[],
  orders: WorkOrder[],
): TechnicianPerformance[] {
  const operators = getActiveFieldOperators(users, roles)

  return operators
    .map((op) => {
      const assigned = orders.filter((o) =>
        isAssignedToOperator(o, op.id, op.name),
      )
      const completed = assigned.filter(isCompleted)
      const inProgress = assigned.filter(isInProgress)
      const cycleDays = completed
        .map(orderCycleDays)
        .filter((d): d is number => d != null && Number.isFinite(d))
      const avgCompletionDays =
        cycleDays.length === 0
          ? 0
          : Math.round(
              (cycleDays.reduce((s, d) => s + d, 0) / cycleDays.length) * 10,
            ) / 10
      const totalRelevant = completed.length + inProgress.length
      const rating =
        totalRelevant === 0
          ? 0
          : Math.round((completed.length / totalRelevant) * 5 * 10) / 10

      return {
        id: op.id,
        name: op.name,
        completedOrders: completed.length,
        inProgress: inProgress.length,
        avgCompletionDays,
        rating,
      } satisfies TechnicianPerformance
    })
    .sort((a, b) => b.completedOrders - a.completedOrders || a.name.localeCompare(b.name, 'es'))
}
