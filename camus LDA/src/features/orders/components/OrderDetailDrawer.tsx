import {
  Calendar,
  Ban,
  CalendarClock,
  FileEdit,
  MapPin,
  Pencil,
  Play,
  Tag,
  Trash2,
  Truck,
  User,
  Wrench,
  FileX2,
} from 'lucide-react'
import { Drawer } from '@/components/ui/Drawer'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useOrdersStore } from '@/store/useOrdersStore'
import { useInventoryStore } from '@/store/useInventoryStore'
import { useSessionUser } from '@/features/auth/useSessionUser'
import { isFieldOperator } from '@/features/auth/roleAccess'
import { InterventionRegisterPanel } from '@/features/orders/components/InterventionRegisterPanel'
import { InterventionHistoryPanel } from '@/features/orders/components/InterventionHistoryPanel'
import { OrderAssignmentPanel } from '@/features/orders/components/OrderAssignmentPanel'
import { OrderDatesPanel } from '@/features/orders/components/OrderDatesPanel'
import { OrderPhotosPanel } from '@/features/orders/components/OrderPhotosPanel'
import { StatusHistoryPanel } from '@/features/orders/components/StatusHistoryPanel'
import { OrderEvidencePanel } from '@/features/orders/components/OrderEvidencePanel'
import { OrderLocationCard } from '@/features/orders/components/OrderLocationCard'
import { OrderPdfPanel } from '@/features/orders/components/OrderPdfPanel'
import { ThirdPartyPanel } from '@/features/orders/components/ThirdPartyPanel'
import { OrderDocumentsPanel } from '@/features/orders/components/OrderDocumentsPanel'
import { OrderSuppliesPanel } from '@/features/orders/components/OrderSuppliesPanel'
import { OrderApprovalPanel } from '@/features/orders/components/OrderApprovalPanel'
import { OrderCommentsPanel } from '@/features/orders/components/OrderCommentsPanel'
import {
  OrderRescheduleHistoryPanel,
} from '@/features/orders/components/RescheduleOrderModal'
import { OrderModificationHistoryPanel } from '@/features/orders/components/OrderModificationHistoryPanel'
import {
  canEditOrder,
  isAssignedToOrder,
  orderEditBlockedMessage,
} from '@/features/orders/utils/canEditOrder'
import { formatDisplayDate } from '@/features/orders/utils/orderDates'
import {
  displayProgress,
  progressForStatus,
} from '@/features/orders/utils/orderProgress'
import type { OrderStatus, WorkOrder } from '@/types'
import { cn } from '@/utils/cn'

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof User
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          {label}
        </p>
        <p className="mt-0.5 break-words text-sm font-medium text-slate-900">
          {value}
        </p>
      </div>
    </div>
  )
}

function ProgressBar({ progress }: { progress?: number | null }) {
  const pct = displayProgress(progress)
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-500">Progreso</span>
        <span className="font-semibold text-slate-900">{pct}%</span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full origin-left rounded-full bg-primary"
          style={{ width: `${pct}%` }}
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          role="progressbar"
        />
      </div>
    </div>
  )
}

function nextStatus(status: OrderStatus): OrderStatus | null {
  if (status === 'Pendiente') return 'En Curso'
  if (status === 'En Curso') return 'Completada'
  return null
}

export function OrderDetailDrawer({
  open,
  order,
  onClose,
}: {
  open: boolean
  order: WorkOrder | null
  onClose: () => void
}) {
  const openEditModal = useOrdersStore((s) => s.openEditModal)
  const openDeleteModal = useOrdersStore((s) => s.openDeleteModal)
  const openCancelModal = useOrdersStore((s) => s.openCancelModal)
  const openAnnulModal = useOrdersStore((s) => s.openAnnulModal)
  const openRescheduleModal = useOrdersStore((s) => s.openRescheduleModal)
  const openModificationRequestModal = useOrdersStore((s) => s.openModificationRequestModal)
  const updateOrder = useOrdersStore((s) => s.updateOrder)
  const addToast = useOrdersStore((s) => s.addToast)
  const orders = useOrdersStore((s) => s.orders)
  const products = useInventoryStore((s) => s.products)
  const currentUser = useSessionUser()

  const liveOrder =
    order != null
      ? (orders.find((o) => o.id === order.id) ?? order)
      : null

  const isReady = Boolean(liveOrder)
  const status = liveOrder?.status ?? 'Pendiente'
  const next = nextStatus(status)
  const assignedTruck = liveOrder?.truckCode
    ? products.find((p) => p.code === liveOrder.truckCode) ?? null
    : null
  const editable = liveOrder ? canEditOrder(currentUser, liveOrder) : false
  const canApprove = !isFieldOperator(currentUser)
  const canManageLifecycle =
    canApprove && liveOrder && liveOrder.status !== 'Cancelada'
  const isAssignedOperator = liveOrder
    ? isAssignedToOrder(currentUser, liveOrder)
    : false
  const canReschedule =
    canApprove &&
    liveOrder &&
    (liveOrder.status === 'Pendiente' || liveOrder.status === 'En Curso')

  const guardEdit = (action: () => void) => {
    if (!liveOrder) return
    if (!editable) {
      addToast(orderEditBlockedMessage(liveOrder), 'error')
      return
    }
    action()
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Detalle de Orden"
      widthClassName="w-full sm:max-w-2xl"
      footer={
        !isReady || !liveOrder ? null : (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              leftIcon={<Pencil className="h-4 w-4" />}
              onClick={() => {
                guardEdit(() => {
                  onClose()
                  openEditModal(liveOrder)
                })
              }}
            >
              Editar
            </Button>
            <Button
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50"
              leftIcon={<Trash2 className="h-4 w-4" />}
              onClick={() => {
                guardEdit(() => {
                  onClose()
                  openDeleteModal(liveOrder)
                })
              }}
            >
              Eliminar
            </Button>
            {canManageLifecycle && (
              <>
                <Button
                  variant="outline"
                  className="border-amber-200 text-amber-700 hover:bg-amber-50"
                  leftIcon={<Ban className="h-4 w-4" />}
                  onClick={() => {
                    onClose()
                    openCancelModal(liveOrder)
                  }}
                >
                  Cancelar Orden
                </Button>
                <Button
                  variant="outline"
                  className="border-red-200 text-red-600 hover:bg-red-50"
                  leftIcon={<FileX2 className="h-4 w-4" />}
                  onClick={() => {
                    onClose()
                    openAnnulModal(liveOrder)
                  }}
                >
                  Anular Orden
                </Button>
              </>
            )}
            {canReschedule && (
              <Button
                variant="outline"
                leftIcon={<CalendarClock className="h-4 w-4" />}
                onClick={() => {
                  onClose()
                  openRescheduleModal(liveOrder)
                }}
              >
                Reprogramar fecha
              </Button>
            )}
            {isAssignedOperator && isFieldOperator(currentUser) && (
              <Button
                variant="outline"
                leftIcon={<FileEdit className="h-4 w-4" />}
                onClick={() => {
                  onClose()
                  openModificationRequestModal(liveOrder)
                }}
              >
                Solicitar modificación
              </Button>
            )}
            {next && (
              <Button
                leftIcon={<Play className="h-4 w-4" />}
                onClick={() => {
                  guardEdit(() => {
                    updateOrder(liveOrder.id, {
                      status: next,
                      progress: progressForStatus(next, liveOrder.progress),
                      ...(next === 'En Curso' && !liveOrder.startDate
                        ? { startDate: new Date().toISOString().slice(0, 10) }
                        : null),
                      ...(next === 'Completada'
                        ? {
                            endDate:
                              liveOrder.endDate ??
                              new Date().toISOString().slice(0, 10),
                          }
                        : null),
                    })
                    addToast(
                      next === 'En Curso'
                        ? 'Orden iniciada'
                        : 'Orden completada',
                    )
                  })
                }}
              >
                {status === 'Pendiente' ? 'Iniciar Trabajo' : 'Completar'}
              </Button>
            )}
          </div>
        )
      }
    >
      {!open ? null : !liveOrder ? (
        <p className="text-sm text-slate-500">Selecciona una orden para ver su detalle.</p>
      ) : (
        <div className="space-y-4">
          {!editable && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Solo lectura: esta OT no está asignada a tu usuario.
            </div>
          )}

          <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500">ID Orden</p>
                <p className="mt-1 truncate text-lg font-bold text-slate-900">
                  {liveOrder.id}
                </p>
                <p className="mt-1 truncate text-sm text-slate-600">
                  {liveOrder.client}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge label={liveOrder.status} context="order" />
                <span
                  className={cn(
                    'rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset',
                    liveOrder.priority === 'Urgente' || liveOrder.priority === 'Alta'
                      ? 'bg-red-50 text-red-700 ring-red-600/20'
                      : liveOrder.priority === 'Media'
                        ? 'bg-amber-50 text-amber-700 ring-amber-600/20'
                        : 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
                  )}
                >
                  Prioridad {liveOrder.priority ?? 'Media'}
                  {liveOrder.priorityManual ? ' (manual)' : ''}
                </span>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
              <span className="inline-flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-400" />
                Creada {liveOrder.createdAt}
              </span>
              {liveOrder.startDate && (
                <span>Inicio {formatDisplayDate(liveOrder.startDate)}</span>
              )}
              {liveOrder.endDate && (
                <span>Término {formatDisplayDate(liveOrder.endDate)}</span>
              )}
              {liveOrder.durationHours != null && (
                <span>{liveOrder.durationHours} h</span>
              )}
            </div>
          </div>

          <div className="grid gap-3">
            <InfoRow icon={Wrench} label="Descripción" value={liveOrder.service ?? '—'} />
            <InfoRow icon={MapPin} label="Dirección" value={liveOrder.address} />
            <InfoRow
              icon={Tag}
              label="Incidente / Categoría"
              value={liveOrder.incidentType ?? liveOrder.category}
            />
            <InfoRow
              icon={Truck}
              label="Camión asignado"
              value={
                assignedTruck
                  ? `${assignedTruck.code} — ${assignedTruck.name}`
                  : liveOrder.truckCode
                    ? liveOrder.truckCode
                    : 'Sin asignar'
              }
            />
            <InfoRow
              icon={User}
              label="Técnicos / cuadrilla"
              value={
                liveOrder.operators?.length
                  ? liveOrder.operators.map((o) => o.name).join(', ')
                  : (liveOrder.technician ?? 'Sin asignar')
              }
            />
          </div>

          <div className="flex flex-wrap gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs">
            <span className="font-medium text-slate-600">Ir a:</span>
            <a
              href="#insumos-ot"
              className="font-semibold text-primary hover:underline"
            >
              Insumos de la OT
            </a>
            <span className="text-slate-300">|</span>
            <a href="#comentarios-ot" className="text-slate-600 hover:text-primary hover:underline">
              Comentarios
            </a>
          </div>

          {(liveOrder.cancelReason || liveOrder.annulReason) && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              {liveOrder.cancelReason && (
                <p>
                  <strong>Motivo cancelación:</strong> {liveOrder.cancelReason}
                </p>
              )}
              {liveOrder.annulReason && (
                <p className={liveOrder.cancelReason ? 'mt-1' : ''}>
                  <strong>Motivo anulación:</strong> {liveOrder.annulReason}
                </p>
              )}
            </div>
          )}

          {/* RF65 — comentarios */}
          <OrderCommentsPanel order={liveOrder} />

          {/* RF62 — insumos */}
          <OrderSuppliesPanel order={liveOrder} canEdit={editable || canApprove} />

          {/* RF63 — aprobación */}
          <OrderApprovalPanel order={liveOrder} canApprove={canApprove} />

          {/* CU-160–164 */}
          <OrderAssignmentPanel order={liveOrder} canEdit={editable} />

          {/* CU-152–154 */}
          <OrderDatesPanel order={liveOrder} canEdit={editable} />

          {/* CU-149 */}
          {editable && <InterventionRegisterPanel orderId={liveOrder.id} />}

          {/* CU-150–151 */}
          <InterventionHistoryPanel orderId={liveOrder.id} canEdit={editable} />

          {/* RF09 CU-30–34: evidencia visual en servidor */}
          <OrderEvidencePanel
            order={liveOrder}
            canUpload={editable}
            canManage={canApprove}
          />

          {/* Evidencia fotográfica por URL */}
          <OrderPhotosPanel order={liveOrder} canEdit={editable} />

          {/* CU-188–191 */}
          <ThirdPartyPanel order={liveOrder} canEdit={editable} />

          {/* RF-40..42 documentos / contratos / versiones */}
          <OrderDocumentsPanel order={liveOrder} canEdit={editable} />

          {/* CU-173–176 */}
          <OrderPdfPanel order={liveOrder} />

          {/* RF66 CDS 229 */}
          <OrderRescheduleHistoryPanel orderId={liveOrder.id} />

          {/* RF68 CDS 235 */}
          <OrderModificationHistoryPanel orderId={liveOrder.id} />

          {/* RF29 CU-99 */}
          {canApprove && (
            <StatusHistoryPanel orderId={liveOrder.id} refreshKey={liveOrder.status} />
          )}

          <ProgressBar progress={liveOrder.progress} />
          <OrderLocationCard order={liveOrder} />
        </div>
      )}
    </Drawer>
  )
}
