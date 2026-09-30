import { useNavigate } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { CuPageBanner } from '@/components/ui/CuPageBanner'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { FormField } from '@/components/ui/FormField'
import { ToastContainerView } from '@/components/ui/ToastContainer'
import { ROUTES } from '@/constants/routes'
import { useFieldOrderRegister } from '@/features/operations/hooks/useFieldOrderRegister'
import { useOrdersStore } from '@/store/useOrdersStore'
import type { IncidentType, OrderPriority } from '@/types'

/** RF43 — CU-148: Completar formulario / guardado temporal */
export function Cu148CompleteFieldFormPage() {
  const navigate = useNavigate()
  const {
    incidentTypes,
    suggestedId,
    offlineMode,
    client,
    setClient,
    address,
    setAddress,
    service,
    setService,
    incidentType,
    setIncidentType,
    priority,
    setPriority,
    notes,
    setNotes,
    errors,
    saveDraft,
    submitOrder,
  } = useFieldOrderRegister()

  const toasts = useOrdersStore((s) => s.toasts)
  const removeToast = useOrdersStore((s) => s.removeToast)

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="Operaciones en Terreno"
          subtitle="Vista dedicada al caso de uso CU-148."
          action={
            <Button variant="outline" onClick={() => navigate(ROUTES.CU147)}>
              Volver a CU-147
            </Button>
          }
        />

        <CuPageBanner
          rf="RF43"
          rfTitle="Registro de orden de trabajo en terreno"
          cu="CU-148"
          cuTitle="Completar formulario y guardado temporal"
        />

        <Card className="p-6">
          <p className="mb-4 text-sm text-slate-600">
            OT en registro: <strong>{suggestedId}</strong>
            {offlineMode && (
              <span className="ml-2 text-amber-700">· Guardado local hasta sincronización</span>
            )}
          </p>
          <div className="space-y-4">
            <FormField label="Cliente" required error={errors.client}>
              <Input value={client} onChange={(e) => setClient(e.target.value)} placeholder="Nombre o empresa" />
            </FormField>
            <FormField label="Dirección del servicio" required error={errors.address}>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Calle, número, comuna"
                icon={<MapPin className="h-4 w-4" />}
              />
            </FormField>
            <FormField label="Descripción del trabajo" required error={errors.service}>
              <Input
                value={service}
                onChange={(e) => setService(e.target.value)}
                placeholder="Ej. Desobstrucción de ducto"
              />
            </FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Tipo de incidente">
                <Select
                  value={incidentType}
                  onChange={(e) => setIncidentType(e.target.value as IncidentType)}
                >
                  {incidentTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Prioridad">
                <Select value={priority} onChange={(e) => setPriority(e.target.value as OrderPriority)}>
                  <option value="Baja">Baja</option>
                  <option value="Media">Media</option>
                  <option value="Alta">Alta</option>
                  <option value="Urgente">Urgente</option>
                </Select>
              </FormField>
            </div>
            <FormField label="Observaciones (opcional)">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </FormField>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => saveDraft()}>
                Guardar temporalmente
              </Button>
              <Button onClick={() => submitOrder()}>Finalizar registro</Button>
            </div>
          </div>
        </Card>
      </div>
      <ToastContainerView toasts={toasts} onRemove={removeToast} />
    </>
  )
}
