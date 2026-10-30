import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { useOrdersStore } from '@/store/useOrdersStore'
import { useClientsStore } from '@/store/useClientsStore'
import { mockEquipment } from '@/data/mock/equipment'
import { ROUTES } from '@/constants/routes'

/** RF-31 — búsqueda puntual de órdenes, clientes y maquinaria */
export function GlobalSearch() {
  const navigate = useNavigate()
  const orders = useOrdersStore((s) => s.orders)
  const openViewModal = useOrdersStore((s) => s.openViewModal)
  const clients = useClientsStore((s) => s.clients)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (q.length < 2) return []

    const orderHits = orders
      .filter(
        (order) =>
          order.id.toLowerCase().includes(q) ||
          order.client.toLowerCase().includes(q) ||
          (order.service ?? '').toLowerCase().includes(q) ||
          order.address.toLowerCase().includes(q),
      )
      .slice(0, 5)
      .map((order) => ({
        id: `ot-${order.id}`,
        kind: 'Orden' as const,
        label: `${order.id} — ${order.client}`,
        onSelect: () => {
          openViewModal(order)
          navigate(ROUTES.ORDENES)
        },
      }))

    const clientHits = clients
      .filter(
        (client) =>
          client.name.toLowerCase().includes(q) ||
          client.rut.toLowerCase().includes(q) ||
          client.company.toLowerCase().includes(q),
      )
      .slice(0, 5)
      .map((client) => ({
        id: `cli-${client.id}`,
        kind: 'Cliente' as const,
        label: `${client.name} (${client.rut})`,
        onSelect: () => navigate(ROUTES.CLIENTES),
      }))

    const equipmentHits = mockEquipment
      .filter(
        (eq) =>
          eq.code.toLowerCase().includes(q) ||
          eq.name.toLowerCase().includes(q) ||
          eq.serialNumber.toLowerCase().includes(q),
      )
      .slice(0, 5)
      .map((eq) => ({
        id: `eq-${eq.id}`,
        kind: 'Maquinaria' as const,
        label: `${eq.code} — ${eq.name}`,
        onSelect: () => navigate(ROUTES.INVENTARIO),
      }))

    return [...orderHits, ...clientHits, ...equipmentHits]
  }, [query, orders, clients, openViewModal, navigate])

  return (
    <div className="relative hidden min-w-0 flex-1 max-w-md md:block">
      <label className="sr-only" htmlFor="global-search">
        Buscar órdenes, clientes o maquinaria
      </label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          id="global-search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 150)}
          placeholder="Buscar OT, cliente o maquinaria…"
          className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-800 outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
        />
      </div>
      {open && query.trim().length >= 2 && (
        <div className="absolute z-40 mt-1 max-h-72 w-full overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-600 dark:bg-slate-900">
          {results.length === 0 ? (
            <p className="px-3 py-3 text-sm text-slate-500">Sin resultados</p>
          ) : (
            <ul>
              {results.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      item.onSelect()
                      setQuery('')
                      setOpen(false)
                    }}
                  >
                    <span className="mt-0.5 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                      {item.kind}
                    </span>
                    <span className="text-slate-800 dark:text-slate-100">{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
