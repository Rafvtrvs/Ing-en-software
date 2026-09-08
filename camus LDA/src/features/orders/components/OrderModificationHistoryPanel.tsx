import { FileEdit } from 'lucide-react'
import { useMemo } from 'react'
import { useOrdersStore } from '@/store/useOrdersStore'
import type { OrderModificationHistoryEntry } from '@/types'

const EMPTY_HISTORY: OrderModificationHistoryEntry[] = []

/** RF68 — CDS 235: Historial de modificaciones (solo lectura) */
export function OrderModificationHistoryPanel({ orderId }: { orderId: string }) {
  const rawHistory = useOrdersStore(
    (s) => s.modificationHistoryByOrderId[orderId] ?? EMPTY_HISTORY,
  )
  const history = useMemo(
    () =>
      [...rawHistory].sort(
        (a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime(),
      ),
    [rawHistory],
  )

  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <FileEdit className="h-4 w-4 text-slate-400" />
        <p className="text-sm font-semibold text-slate-900">Historial de modificaciones</p>
      </div>
      {history.length === 0 ? (
        <p className="text-sm text-slate-500">No hay modificaciones registradas.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase text-slate-500">
                <th className="px-2 py-2">Fecha</th>
                <th className="px-2 py-2">Hora</th>
                <th className="px-2 py-2">Campo modificado</th>
                <th className="px-2 py-2">Usuario</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {history.map((e) => (
                <tr key={e.id}>
                  <td className="px-2 py-2 text-slate-600">
                    {e.changedAt.slice(0, 10).split('-').reverse().join('/')}
                  </td>
                  <td className="px-2 py-2 text-slate-600">
                    {e.changedAt.includes('T') ? e.changedAt.slice(11, 16) : '—'}
                  </td>
                  <td className="px-2 py-2">
                    <span className="font-medium text-slate-900">{e.fieldLabel}</span>
                    <span className="block text-xs text-slate-500">
                      {e.previousValue} → {e.newValue}
                    </span>
                  </td>
                  <td className="px-2 py-2 text-slate-600">{e.changedByName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
