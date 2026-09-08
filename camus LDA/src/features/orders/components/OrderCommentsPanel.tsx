import { useMemo, useState } from 'react'
import { MessageSquare, User } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useOrdersStore } from '@/store/useOrdersStore'
import { useSessionUser } from '@/features/auth/useSessionUser'
import { formatDisplayDate } from '@/features/orders/utils/orderDates'
import type { OrderComment, WorkOrder } from '@/types'

const EMPTY_COMMENTS: OrderComment[] = []

/**
 * RF65 — CDS 224: Registrar comentarios
 * RF65 — CDS 225: Consultar comentarios
 * RF65 — CDS 226: Trazabilidad automática (autor, fecha, hora)
 */
export function OrderCommentsPanel({ order }: { order: WorkOrder }) {
  const rawComments = useOrdersStore(
    (s) => s.commentsByOrderId[order.id] ?? EMPTY_COMMENTS,
  )
  const comments = useMemo(
    () =>
      [...rawComments].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [rawComments],
  )
  const addOrderComment = useOrdersStore((s) => s.addOrderComment)
  const addToast = useOrdersStore((s) => s.addToast)
  const currentUser = useSessionUser()
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = () => {
    setSubmitting(true)
    const result = addOrderComment(order.id, text, {
      id: currentUser.id ?? 'session',
      name: currentUser.name ?? 'Usuario',
    })
    setSubmitting(false)
    if (!result.ok) {
      addToast(result.message ?? 'Error al guardar comentario', 'error')
      return
    }
    addToast('Comentarios ingresados correctamente')
    setText('')
  }

  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-slate-400" />
        <div>
          <p className="text-sm font-semibold text-slate-900">Comentarios</p>
          <p className="text-xs text-slate-500">
            Registro y consulta de comentarios de la orden
          </p>
        </div>
      </div>

      {comments.length === 0 ? (
        <p className="mb-4 text-sm text-slate-500">
          No hay comentarios registrados para esta orden.
        </p>
      ) : (
        <ul className="mb-4 max-h-56 space-y-3 overflow-y-auto pr-1">
          {comments.map((c) => (
            <li
              key={c.id}
              className="rounded-lg border border-slate-100 bg-slate-50/80 px-4 py-3"
            >
              <p className="text-sm text-slate-800">{c.content}</p>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <User className="h-3 w-3" />
                  <strong className="font-medium text-slate-700">{c.authorName}</strong>
                </span>
                <span>
                  Fecha: {formatDisplayDate(c.createdAt.slice(0, 10))}
                </span>
                <span>
                  Hora:{' '}
                  {c.createdAt.includes('T') ? c.createdAt.slice(11, 16) : '—'}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-2 border-t border-slate-100 pt-4">
        <label htmlFor={`comment-${order.id}`} className="text-sm font-medium text-slate-700">
          Nuevo comentario
        </label>
        <textarea
          id={`comment-${order.id}`}
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escriba un comentario sobre esta orden..."
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <Button
          type="button"
          size="sm"
          disabled={submitting || !text.trim()}
          onClick={handleSubmit}
        >
          Agregar comentario
        </Button>
      </div>
    </div>
  )
}
