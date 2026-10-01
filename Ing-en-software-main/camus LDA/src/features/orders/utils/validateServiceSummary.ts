import type { OrderIntervention, WorkOrder } from '@/types'

/** Campos técnicos obligatorios para el resumen PDF (CU-177) */
export type MandatoryServiceField = {
  key: string
  label: string
}

const MANDATORY_FIELDS: MandatoryServiceField[] = [
  { key: 'client', label: 'Cliente' },
  { key: 'address', label: 'Dirección' },
  { key: 'service', label: 'Descripción del servicio' },
  { key: 'category', label: 'Categoría / tipo de servicio' },
  { key: 'technician', label: 'Técnico o operadores asignados' },
  { key: 'startDate', label: 'Fecha de inicio' },
  { key: 'endDate', label: 'Fecha de término' },
  { key: 'durationHours', label: 'Duración del servicio (horas)' },
  { key: 'interventions', label: 'Al menos una intervención registrada' },
]

function hasText(value?: string | null): boolean {
  return Boolean(value && String(value).trim())
}

/**
 * CU-177: lista campos técnicos pendientes antes de habilitar el PDF.
 * La OT debe estar Completada (equivalente a “Finalizada” en el documento).
 */
export function getMissingServiceSummaryFields(
  order: WorkOrder,
  interventions: OrderIntervention[] = [],
): string[] {
  const missing: string[] = []

  for (const field of MANDATORY_FIELDS) {
    switch (field.key) {
      case 'client':
        if (!hasText(order.client)) missing.push(field.label)
        break
      case 'address':
        if (!hasText(order.address)) missing.push(field.label)
        break
      case 'service':
        if (!hasText(order.service)) missing.push(field.label)
        break
      case 'category':
        if (!hasText(order.category) && !hasText(order.incidentType)) {
          missing.push(field.label)
        }
        break
      case 'technician': {
        const hasOps =
          (order.operators?.length ?? 0) > 0 ||
          (order.operatorIds?.length ?? 0) > 0 ||
          hasText(order.technician)
        if (!hasOps) missing.push(field.label)
        break
      }
      case 'startDate':
        if (!hasText(order.startDate)) missing.push(field.label)
        break
      case 'endDate':
        if (!hasText(order.endDate)) missing.push(field.label)
        break
      case 'durationHours':
        if (order.durationHours == null || Number.isNaN(order.durationHours)) {
          missing.push(field.label)
        }
        break
      case 'interventions':
        if (interventions.length === 0) missing.push(field.label)
        break
      default:
        break
    }
  }

  return missing
}

/** Estado “Finalizada” del documento = Completada en el sistema */
export function isOrderFinishedForSummary(order: WorkOrder): boolean {
  return order.status === 'Completada'
}

export function canGenerateServiceSummary(
  order: WorkOrder,
  interventions: OrderIntervention[] = [],
): { ok: boolean; missing: string[]; finished: boolean } {
  const finished = isOrderFinishedForSummary(order)
  const missing = finished
    ? getMissingServiceSummaryFields(order, interventions)
    : []
  return {
    ok: finished && missing.length === 0,
    missing,
    finished,
  }
}
