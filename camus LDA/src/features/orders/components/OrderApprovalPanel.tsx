import { useMemo, useState } from 'react'
import { CheckCircle2, ClipboardCheck, ShieldCheck } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useOrdersStore } from '@/store/useOrdersStore'
import { useSessionUser } from '@/features/auth/useSessionUser'
import { formatDisplayDate } from '@/features/orders/utils/orderDates'
import type { WorkOrder } from '@/types'
import { cn } from '@/utils/cn'

interface CheckItem {
  key: string
  label: string
  ok: boolean
}

function buildChecks(order: WorkOrder): CheckItem[] {
  return [
    { key: 'client', label: 'Cliente registrado', ok: Boolean(order.client) },
    { key: 'address', label: 'Dirección del servicio', ok: Boolean(order.address) },
    {
      key: 'dates',
      label: 'Fechas de ejecución',
      ok: Boolean(order.startDate || order.createdAt),
    },
    {
      key: 'operators',
      label: 'Responsables / operadores',
      ok: Boolean(order.operators?.length || order.technician),
    },
    {
      key: 'service',
      label: 'Descripción del servicio',
      ok: Boolean(order.service || order.category),
    },
    {
      key: 'evidence',
      label: 'Evidencias fotográficas',
      ok: (order.photoUrls?.length ?? 0) > 0,
    },
    {
      key: 'supplies',
      label: 'Insumos utilizados',
      ok: (order.suppliesUsed?.length ?? 0) > 0,
    },
  ]
}

/**
 * RF63 — CDS 216/217/218: Aprobación formal de OT finalizada con revisión de antecedentes
 */
export function OrderApprovalPanel({
  order,
  canApprove,
}: {
  order: WorkOrder
  canApprove: boolean
}) {
  const approveOrder = useOrdersStore((s) => s.approveOrder)
  const addToast = useOrdersStore((s) => s.addToast)
  const currentUser = useSessionUser()
  const [showValidation, setShowValidation] = useState(false)

  const checks = useMemo(() => buildChecks(order), [order])
  const allOk = checks.every((c) => c.ok)
  const isCompleted = order.status === 'Completada'
  const alreadyApproved = Boolean(order.approval)

  const handleApprove = () => {
    if (!showValidation) {
      setShowValidation(true)
      return
    }
    const result = approveOrder(order.id, {
      approvedBy: currentUser.id ?? 'session',
      approvedByName: currentUser.name ?? 'Usuario',
    })
    if (!result.ok) {
      addToast(result.message ?? 'No fue posible aprobar la orden', 'error')
      return
    }
    setShowValidation(false)
  }

  if (!isCompleted && !alreadyApproved) {
    return null
  }

  return (
    <Card>
      <CardHeader
        title="Aprobación de Orden"
        subtitle="Aprobación formal de orden finalizada."
      />

      {alreadyApproved && order.approval && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-600" />
          <div className="text-sm text-emerald-900">
            <p className="font-semibold">Orden aprobada</p>
            <p className="mt-1 text-emerald-800">
              Por {order.approval.approvedByName} el{' '}
              {formatDisplayDate(order.approval.approvedAt.slice(0, 10))}
            </p>
          </div>
        </div>
      )}

      {isCompleted && !alreadyApproved && canApprove && (
        <>
          {showValidation && (
            <div className="mb-4 space-y-2">
              <p className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <ClipboardCheck className="h-4 w-4 text-primary" />
                Revisión de antecedentes
              </p>
              <ul className="space-y-1.5">
                {checks.map((c) => (
                  <li
                    key={c.key}
                    className={cn(
                      'flex items-center gap-2 rounded-lg px-3 py-2 text-sm',
                      c.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800',
                    )}
                  >
                    <CheckCircle2 className={cn('h-4 w-4', c.ok ? 'text-emerald-600' : 'text-red-500')} />
                    {c.label}
                    <Badge
                      label={c.ok ? 'OK' : 'Pendiente'}
                      className={
                        c.ok
                          ? 'ml-auto bg-emerald-100 text-emerald-700'
                          : 'ml-auto bg-red-100 text-red-700'
                      }
                    />
                  </li>
                ))}
              </ul>
              {!allOk && (
                <p className="text-xs text-amber-700">
                  Complete los antecedentes faltantes antes de aprobar.
                </p>
              )}
            </div>
          )}

          <Button
            leftIcon={<ShieldCheck className="h-4 w-4" />}
            onClick={handleApprove}
            disabled={showValidation && !allOk}
          >
            {showValidation ? 'Confirmar Aprobación' : 'Aprobar Orden'}
          </Button>
          <p className="mt-2 text-xs text-slate-400">
            Se registrará fecha, hora y usuario responsable.
          </p>
        </>
      )}
    </Card>
  )
}
