import { authService } from '@/services/authService'
import { useNotificationsStore } from '@/store/useNotificationsStore'
import type { OrderModificationRequest } from '@/types'

const SEEN_KEY = 'camus_mod_alert_v1'

function loadSeen(): Record<string, string> {
  try {
    const raw = localStorage.getItem(SEEN_KEY)
    const parsed = raw ? (JSON.parse(raw) as Record<string, string>) : {}
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function saveSeen(seen: Record<string, string>) {
  localStorage.setItem(SEEN_KEY, JSON.stringify(seen))
}

function sameActor(a?: string | null, b?: string | null): boolean {
  if (a == null || b == null) return false
  const sa = String(a).trim()
  const sb = String(b).trim()
  if (!sa || !sb) return false
  if (sa === sb) return true
  const na = Number(sa)
  const nb = Number(sb)
  return Number.isFinite(na) && Number.isFinite(nb) && na === nb
}

function push(title: string, message: string, orderId: string) {
  useNotificationsStore.getState().addNotification({
    title,
    message,
    type: 'order',
    orderId,
    link: `/ordenes?order=${encodeURIComponent(orderId)}`,
  })
}

/** Campanita al aparecer una solicitud y al aprobarse o rechazarse. */
export function notifyModificationInbox(requests: OrderModificationRequest[]) {
  if (typeof localStorage === 'undefined') return
  const user = authService.getUser()
  const seen = loadSeen()
  const bootstrapping = Object.keys(seen).length === 0

  for (const req of requests) {
    const prev = seen[req.id]
    if (!prev) {
      if (req.status === 'Pendiente' && !sameActor(req.operatorId, user?.id)) {
        push(
          `Solicitud de cambio en OT ${req.orderId}`,
          `${req.operatorName} solicita modificar: ${req.reason}`,
          req.orderId,
        )
      } else if (
        !bootstrapping &&
        (req.status === 'Aprobada' || req.status === 'Rechazada')
      ) {
        push(
          req.status === 'Aprobada'
            ? `Cambio aprobado en OT ${req.orderId}`
            : `Cambio rechazado en OT ${req.orderId}`,
          decisionMessage(req),
          req.orderId,
        )
      }
      seen[req.id] = req.status
      continue
    }

    if (prev === req.status) continue
    if (req.status === 'Aprobada' || req.status === 'Rechazada') {
      push(
        req.status === 'Aprobada'
          ? `Cambio aprobado en OT ${req.orderId}`
          : `Cambio rechazado en OT ${req.orderId}`,
        decisionMessage(req),
        req.orderId,
      )
    }
    seen[req.id] = req.status
  }

  saveSeen(seen)
}

function decisionMessage(req: OrderModificationRequest): string {
  if (req.status === 'Aprobada') {
    return `La modificación de la orden ${req.orderId} fue aprobada.`
  }
  const why = req.rejectionReason?.trim()
  return why
    ? `La modificación de la orden ${req.orderId} fue rechazada. ${why}`
    : `La modificación de la orden ${req.orderId} fue rechazada.`
}
