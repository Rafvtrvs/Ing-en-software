import { useEffect, useMemo, useState } from 'react'
import { Search, UserRound, Wand2 } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { KpiCard } from '@/components/ui/KpiCard'
import type { AuditLogEntry } from '@/data/mock/audit'
import { useClientsStore } from '@/store/useClientsStore'
import { useOrdersStore } from '@/store/useOrdersStore'
import { useBillingStore } from '@/store/useBillingStore'
import { useReportsStore } from '@/store/useReportsStore'
import { formatCurrency, formatDateTime } from '@/utils/formatters'
import {
  buildClientManagementReport,
  filterClientsBySearch,
} from '@/features/reports/utils/clientTraceabilityReport'
import { ClientVisitRecurrenceChart } from '@/features/reports/components/ClientVisitRecurrenceChart'

interface ClientTraceabilitySectionProps {
  logs: AuditLogEntry[]
  loading: boolean
}

export function ClientTraceabilitySection({ logs, loading }: ClientTraceabilitySectionProps) {
  const clients = useClientsStore((s) => s.clients)
  const orders = useOrdersStore((s) => s.orders)
  const invoices = useBillingStore((s) => s.invoices)
  const addToast = useReportsStore((s) => s.addToast)

  const [search, setSearch] = useState('')
  const [clientId, setClientId] = useState('')
  const [showSearcher, setShowSearcher] = useState(true)
  const [executed, setExecuted] = useState(false)

  const filteredClients = useMemo(
    () => filterClientsBySearch(clients, search),
    [clients, search],
  )

  const selectedClient = clients.find((c) => c.id === clientId) ?? null

  const preview = useMemo(() => {
    if (!selectedClient) return null
    return buildClientManagementReport(selectedClient, orders, invoices, logs)
  }, [selectedClient, orders, invoices, logs])

  useEffect(() => {
    if (!clientId && clients.length > 0) {
      setClientId(clients[0].id)
    }
  }, [clients, clientId])

  useEffect(() => {
    if (filteredClients.length === 0) return
    const stillValid = filteredClients.some((c) => c.id === clientId)
    if (!stillValid) {
      setClientId(filteredClients[0].id)
      setExecuted(false)
    }
  }, [filteredClients, clientId])

  const handleGenerate = () => {
    if (!selectedClient || !preview) return
    setExecuted(true)
    addToast(
      preview.totalServices > 0
        ? `Trazabilidad generada: ${preview.totalServices} servicio(s) vinculados a ${selectedClient.name}`
        : `Sin servicios vinculados al RUT ${selectedClient.rut}`,
      preview.totalServices > 0 ? 'success' : 'info',
    )
  }

  const kpis = [
    {
      title: 'Total servicios',
      value: preview ? String(preview.totalServices) : '—',
      trend: selectedClient ? `RUT ${selectedClient.rut}` : 'Selecciona cliente',
      trendDirection: 'up' as const,
      icon: UserRound,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Cliente analizado',
      value: selectedClient?.name ?? '—',
      trend: selectedClient?.company ?? '—',
      trendDirection: 'up' as const,
      icon: UserRound,
      iconBg: 'bg-violet-50',
      iconColor: 'text-violet-600',
    },
    {
      title: 'Servicios activos',
      value: preview ? String(preview.activeServices) : '—',
      trend: preview ? `${preview.completedServices} completados` : '—',
      trendDirection: 'up' as const,
      icon: UserRound,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.title} data={kpi} />
        ))}
      </div>

      <Card>
        <CardHeader
          title="Trazabilidad por cliente"
          subtitle="Busca un cliente registrado, revisa servicios vinculados por RUT y nombre, y genera el informe de gestión."
          action={
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Search className="h-4 w-4" />}
              onClick={() => setShowSearcher((v) => !v)}
            >
              Buscador
            </Button>
          }
        />

        {showSearcher && (
          <div className="mb-4 space-y-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600">
                Buscador de clientes registrados
              </label>
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setExecuted(false)
                }}
                placeholder="Buscar por nombre, empresa, RUT o email..."
                icon={<Search className="h-4 w-4" />}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600">
                Cliente a analizar
              </label>
              {filteredClients.length === 0 ? (
                <p className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500">
                  No hay clientes que coincidan con la búsqueda.
                </p>
              ) : (
                <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-slate-200 bg-white p-2">
                  {filteredClients.map((client) => {
                    const isSelected = client.id === clientId
                    return (
                      <button
                        key={client.id}
                        type="button"
                        onClick={() => {
                          setClientId(client.id)
                          setExecuted(false)
                        }}
                        className={`flex w-full items-start justify-between gap-3 rounded-lg px-3 py-2 text-left transition ${
                          isSelected
                            ? 'bg-primary/10 ring-1 ring-primary/30'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{client.name}</p>
                          <p className="text-xs text-slate-500">
                            {client.company} · {client.rut}
                          </p>
                        </div>
                        <Badge label={client.status} context="client" />
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {selectedClient && preview && (
          <div className="mb-4 rounded-xl border border-slate-100 bg-white p-4 text-sm text-slate-700">
            <p>
              Servicios vinculados a <span className="font-semibold">{selectedClient.name}</span>{' '}
              (<span className="font-mono text-xs">{selectedClient.rut}</span>):{' '}
              <span className="font-semibold text-slate-900">{preview.totalServices}</span>
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Cruce por nombre de contacto, razón social y RUT en órdenes de trabajo y facturación.
            </p>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-600">
            {loading ? (
              <span>Cargando historial de trazabilidad...</span>
            ) : executed && selectedClient ? (
              <span>
                Resumen generado para{' '}
                <span className="font-semibold text-slate-900">{selectedClient.name}</span>
              </span>
            ) : (
              <span>Selecciona un cliente y solicita el resumen de trazabilidad.</span>
            )}
          </p>
          <Button
            type="button"
            leftIcon={<Wand2 className="h-4 w-4" />}
            onClick={handleGenerate}
            disabled={!selectedClient || loading}
          >
            Solicitar resumen de trazabilidad
          </Button>
        </div>

        {executed && preview && (
          <div className="mt-6 space-y-6">
            <ClientVisitRecurrenceChart
              data={preview.visitRecurrence}
              clientName={preview.client.name}
            />

            <Card>
              <CardHeader
                title="Informe de gestión de clientes"
                subtitle={`${preview.client.name} — ${preview.client.company}`}
              />
              <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">RUT</p>
                  <p className="font-semibold text-slate-900">{preview.client.rut}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Total facturado</p>
                  <p className="font-semibold text-slate-900">
                    {formatCurrency(preview.totalBilled)}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Facturas</p>
                  <p className="font-semibold text-slate-900">{preview.invoices.length}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Eventos de auditoría</p>
                  <p className="font-semibold text-slate-900">{preview.auditEvents.length}</p>
                </div>
              </div>

              <p className="mb-2 text-sm font-semibold text-slate-900">Servicios vinculados</p>
              {preview.orders.length === 0 ? (
                <p className="rounded-xl border border-slate-100 p-4 text-sm text-slate-500">
                  No se encontraron órdenes de trabajo para este cliente.
                </p>
              ) : (
                <div className="mb-6 overflow-x-auto rounded-xl border border-slate-100">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50">
                        <th className="px-4 py-3 text-xs font-semibold uppercase text-slate-500">
                          OT
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold uppercase text-slate-500">
                          Servicio
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold uppercase text-slate-500">
                          Fecha
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold uppercase text-slate-500">
                          Técnico
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold uppercase text-slate-500">
                          Estado
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {preview.orders.map((order) => (
                        <tr key={order.id} className="hover:bg-slate-50/80">
                          <td className="px-4 py-3 font-medium text-slate-900">{order.id}</td>
                          <td className="px-4 py-3 text-slate-700">
                            {order.service ?? order.category}
                          </td>
                          <td className="px-4 py-3 text-slate-600">{order.createdAt}</td>
                          <td className="px-4 py-3 text-slate-600">{order.technician ?? '—'}</td>
                          <td className="px-4 py-3">
                            <Badge label={order.status} context="order" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {preview.auditEvents.length > 0 && (
                <>
                  <p className="mb-2 text-sm font-semibold text-slate-900">
                    Historial de trazabilidad
                  </p>
                  <ol className="space-y-2">
                    {preview.auditEvents.slice(0, 5).map((event) => (
                      <li
                        key={event.id}
                        className="rounded-lg border border-slate-100 bg-slate-50/50 px-4 py-3 text-sm"
                      >
                        <p className="font-medium text-slate-900">
                          {event.moduloAfectado} — {event.accion}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {formatDateTime(event.fechaHora)} · {event.usuario}
                        </p>
                      </li>
                    ))}
                  </ol>
                </>
              )}
            </Card>
          </div>
        )}
      </Card>
    </div>
  )
}
