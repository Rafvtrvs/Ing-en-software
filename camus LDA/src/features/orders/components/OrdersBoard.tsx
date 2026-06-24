import type { OrderStatus, WorkOrder } from '@/types'
import { cn } from '@/utils/cn'
import { Badge } from '@/components/ui/Badge'
import { useOrdersStore } from '@/store/useOrdersStore'
import { getColumnOrders, ORDER_STATUSES } from '@/features/orders/utils/orderSort'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  useDroppable,
  type DraggableAttributes,
} from '@dnd-kit/core'
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import { useMemo, useState, type CSSProperties, type ReactNode } from 'react'

const columns: { title: OrderStatus; hint: string; ring: string }[] = [
  { title: 'Pendiente', hint: 'Por iniciar', ring: 'ring-blue-500/20' },
  { title: 'En Curso', hint: 'En ejecución', ring: 'ring-amber-500/20' },
  { title: 'Abonado', hint: 'Pago parcial', ring: 'ring-violet-500/20' },
  { title: 'Completada', hint: 'Finalizadas', ring: 'ring-emerald-500/20' },
  { title: 'Cancelada', hint: 'Anuladas', ring: 'ring-slate-400/20' },
]

function OrderCard({
  order,
  dragHandleRef,
  dragListeners,
  dragAttributes,
}: {
  order: WorkOrder
  dragHandleRef?: (element: HTMLButtonElement | null) => void
  dragListeners?: SyntheticListenerMap
  dragAttributes?: DraggableAttributes
}) {
  const openViewModal = useOrdersStore((s) => s.openViewModal)
  const updateOrder = useOrdersStore((s) => s.updateOrder)

  const nextStatus: Partial<Record<OrderStatus, OrderStatus>> = {
    Pendiente: 'En Curso',
    'En Curso': 'Completada',
  }

  return (
    <div
      className={cn(
        'w-full rounded-xl border border-slate-100 bg-white p-4 text-left shadow-sm',
        'transition hover:border-primary/30 hover:bg-slate-50/50',
      )}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          ref={dragHandleRef}
          className="mt-0.5 cursor-grab touch-none rounded p-0.5 text-slate-300 hover:text-slate-500 active:cursor-grabbing"
          aria-label="Arrastrar orden"
          onClick={(e) => e.stopPropagation()}
          {...dragListeners}
          {...dragAttributes}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="min-w-0 flex-1 text-left"
          onClick={() => openViewModal(order)}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">{order.id}</p>
              <p className="mt-1 truncate text-xs text-slate-500">{order.client}</p>
            </div>
            <Badge
              label={order.priority ?? 'Media'}
              className="bg-slate-100 text-slate-700 ring-slate-500/20"
            />
          </div>
          <p className="mt-3 line-clamp-2 text-sm text-slate-700">
            {order.service ?? order.category}
          </p>
          <p className="mt-2 text-xs text-slate-500">{order.address}</p>
        </button>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 pl-6">
        <Badge label={order.status} context="order" />
        {order.status !== 'Cancelada' &&
          order.status !== 'Completada' &&
          order.status !== 'Abonado' && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              const next = nextStatus[order.status]
              if (next) updateOrder(order.id, { status: next })
            }}
            className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200"
          >
            {order.status === 'Pendiente' ? 'Iniciar' : 'Completar'}
          </button>
        )}
      </div>
    </div>
  )
}

function SortableOrderCard({ order }: { order: WorkOrder }) {
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
    <div
      ref={setNodeRef}
      style={style}
      className={cn(isDragging && 'opacity-60')}
    >
      <OrderCard
        order={order}
        dragHandleRef={setActivatorNodeRef}
        dragListeners={listeners}
        dragAttributes={attributes}
      />
    </div>
  )
}

function DroppableColumn({
  id,
  children,
}: {
  id: OrderStatus
  children: ReactNode
}) {
  const { setNodeRef, isOver } = useDroppable({ id })
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'min-h-[80px] space-y-3 rounded-xl transition-colors',
        isOver && 'bg-primary/5 ring-2 ring-primary/25',
      )}
    >
      {children}
    </div>
  )
}

export function OrdersBoard() {
  const orders = useOrdersStore((s) => s.orders)
  const moveOrderOnBoard = useOrdersStore((s) => s.moveOrderOnBoard)
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  )

  const grouped = useMemo(() => {
    const by = {} as Record<OrderStatus, WorkOrder[]>
    ORDER_STATUSES.forEach((status) => {
      by[status] = getColumnOrders(orders, status)
    })
    return by
  }, [orders])

  const activeOrder = activeId ? orders.find((o) => o.id === activeId) : null

  const handleDragStart = (e: DragStartEvent) => {
    setActiveId(String(e.active.id))
  }

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e
    setActiveId(null)
    if (!over) return

    const activeOrderId = String(active.id)
    const overId = String(over.id)
    if (activeOrderId === overId) return

    moveOrderOnBoard(activeOrderId, overId)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid gap-4 lg:grid-cols-4">
        {columns.map((col) => {
          const items = grouped[col.title]
          return (
            <div
              key={col.title}
              className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
            >
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{col.title}</p>
                  <p className="text-xs text-slate-500">{col.hint}</p>
                </div>
                <span
                  className={cn(
                    'rounded-full px-2 py-1 text-xs font-semibold text-slate-700 ring-1',
                    col.ring,
                  )}
                >
                  {items.length}
                </span>
              </div>

              <SortableContext
                items={items.map((o) => o.id)}
                strategy={verticalListSortingStrategy}
              >
                <DroppableColumn id={col.title}>
                  {items.length === 0 ? (
                    <p className="rounded-lg bg-slate-50 px-3 py-3 text-xs text-slate-500">
                      Arrastra una orden aquí
                    </p>
                  ) : (
                    items.map((order) => (
                      <SortableOrderCard key={order.id} order={order} />
                    ))
                  )}
                </DroppableColumn>
              </SortableContext>
            </div>
          )
        })}
      </div>

      <DragOverlay>
        {activeOrder ? (
          <div className="w-[320px] rotate-1 shadow-lg">
            <OrderCard order={activeOrder} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
