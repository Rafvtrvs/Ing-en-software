import { useMemo, useState, type CSSProperties } from 'react'
import { GripVertical, ListOrdered } from 'lucide-react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type DraggableAttributes,
} from '@dnd-kit/core'
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities'
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useOrdersStore } from '@/store/useOrdersStore'
import {
  comparePriorityDesc,
  isUrgentPriority,
} from '@/features/orders/utils/priorityRules'
import type { WorkOrder } from '@/types'
import { cn } from '@/utils/cn'

function buildQueue(orders: WorkOrder[], urgencyFilter: 'all' | 'urgent') {
  let list = orders.filter(
    (o) => o.status === 'Pendiente' || o.status === 'En Curso',
  )
  if (urgencyFilter === 'urgent') {
    list = list.filter((o) => isUrgentPriority(o.priority))
  }
  return [...list].sort((a, b) => {
    const aq = a.queueOrder
    const bq = b.queueOrder
    if (aq != null && bq != null && aq !== bq) return aq - bq
    if (aq != null && bq == null) return -1
    if (aq == null && bq != null) return 1
    const byPrio = comparePriorityDesc(a.priority, b.priority)
    if (byPrio !== 0) return byPrio
    return (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
  })
}

function QueueItemContent({
  order,
  index,
  dragHandleRef,
  dragListeners,
  dragAttributes,
}: {
  order: WorkOrder
  index: number
  dragHandleRef?: (element: HTMLButtonElement | null) => void
  dragListeners?: SyntheticListenerMap
  dragAttributes?: DraggableAttributes
}) {
  const openViewModal = useOrdersStore((s) => s.openViewModal)

  return (
    <div className="flex w-full items-center gap-3 rounded-lg border border-slate-100 bg-white px-3 py-2.5 text-left shadow-sm">
      <button
        type="button"
        ref={dragHandleRef}
        className="cursor-grab touch-none rounded p-0.5 text-slate-300 hover:text-slate-500 active:cursor-grabbing"
        aria-label="Arrastrar en la cola"
        onClick={(e) => e.stopPropagation()}
        {...dragListeners}
        {...dragAttributes}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => openViewModal(order)}
        className="flex min-w-0 flex-1 items-center gap-3 text-left transition hover:opacity-90"
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
          {index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-slate-900">{order.id}</span>
            <Badge label={order.status} context="order" />
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset',
                order.priority === 'Urgente'
                  ? 'bg-red-100 text-red-800 ring-red-600/30'
                  : order.priority === 'Alta'
                    ? 'bg-red-50 text-red-700 ring-red-600/20'
                    : order.priority === 'Media'
                      ? 'bg-amber-50 text-amber-700 ring-amber-600/20'
                      : 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
              )}
            >
              {order.priority ?? 'Media'}
            </span>
          </div>
          <p className="mt-0.5 truncate text-xs text-slate-500">
            {order.client} · {order.incidentType ?? order.category}
          </p>
        </div>
        <ListOrdered className="h-4 w-4 shrink-0 text-slate-300" />
      </button>
    </div>
  )
}

function SortableQueueItem({
  order,
  index,
}: {
  order: WorkOrder
  index: number
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: order.id })

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(isDragging && 'opacity-50')}
    >
      <QueueItemContent
        order={order}
        index={index}
        dragHandleRef={setActivatorNodeRef}
        dragListeners={listeners}
        dragAttributes={attributes}
      />
    </li>
  )
}

/** Cola de atención jerarquizada, reordenable por arrastre */
export function PriorityQueuePanel({
  ordersOverride,
}: {
  ordersOverride?: WorkOrder[]
} = {}) {
  const storeOrders = useOrdersStore((s) => s.orders)
  const orders = ordersOverride ?? storeOrders
  const urgencyFilter = useOrdersStore((s) => s.urgencyFilter)
  const reorderPriorityQueue = useOrdersStore((s) => s.reorderPriorityQueue)
  const addToast = useOrdersStore((s) => s.addToast)

  const [activeId, setActiveId] = useState<string | null>(null)

  const queue = useMemo(
    () => buildQueue(orders, urgencyFilter),
    [orders, urgencyFilter],
  )

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  )

  const activeOrder = activeId
    ? (queue.find((o) => o.id === activeId) ?? null)
    : null
  const activeIndex = activeOrder
    ? queue.findIndex((o) => o.id === activeOrder.id)
    : -1

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id))
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    if (!over || active.id === over.id) return

    const oldIndex = queue.findIndex((o) => o.id === active.id)
    const newIndex = queue.findIndex((o) => o.id === over.id)
    if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return

    const next = arrayMove(queue, oldIndex, newIndex)
    reorderPriorityQueue(next.map((o) => o.id))
    addToast('Cola de atención reordenada', 'info')
  }

  const handleDragCancel = () => setActiveId(null)

  return (
    <Card>
      <CardHeader
        title="Cola de atención"
        subtitle="Arrastra las órdenes para cambiar el orden de atención"
      />
      {queue.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500">
          No hay órdenes en cola
          {urgencyFilter === 'urgent' ? ' con urgencia' : ''}.
        </p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <SortableContext
            items={queue.map((o) => o.id)}
            strategy={verticalListSortingStrategy}
          >
            <ol className="space-y-2">
              {queue.map((o, idx) => (
                <SortableQueueItem key={o.id} order={o} index={idx} />
              ))}
            </ol>
          </SortableContext>
          <DragOverlay>
            {activeOrder ? (
              <div className="scale-[1.02] shadow-lg">
                <QueueItemContent order={activeOrder} index={activeIndex} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </Card>
  )
}
