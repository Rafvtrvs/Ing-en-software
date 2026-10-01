import { useMemo, useState } from 'react'
import { ClipboardList, MapPin } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { FormField } from '@/components/ui/FormField'
import { useOrdersStore } from '@/store/useOrdersStore'
import { useOperationsStore } from '@/store/useOperationsStore'
import { useSessionUser } from '@/features/auth/useSessionUser'
import type { IncidentType, OrderPriority, WorkOrder } from '@/types'

const INCIDENT_TYPES: IncidentType[] = [
  'Obstrucción',
  'Fuga',
  'Colapso',
  'Rotura de Tubería',
  'Rebalse',
  'Mantención',
  'Otros',
]

interface FieldOrderRegisterModalProps {
  open: boolean
  onClose: () => void
}

/** RF43 — CU-147 / CU-148: registro y formulario de OT en terreno */
export function FieldOrderRegisterModal({ open, onClose }: FieldOrderRegisterModalProps) {
  const orders = useOrdersStore((s) => s.orders)
  const addOrder = useOrdersStore((s) => s.addOrder)
  const addToast = useOrdersStore((s) => s.addToast)
  const offlineMode = useOperationsStore((s) => s.offlineMode)
  const queueOfflineEntry = useOperationsStore((s) => s.queueOfflineEntry)
  const currentUser = useSessionUser()

  const [step, setStep] = useState<1 | 2>(1)
  const [client, setClient] = useState('')
  const [address, setAddress] = useState('')
  const [service, setService] = useState('')
  const [incidentType, setIncidentType] = useState<IncidentType>('Obstrucción')
  const [priority, setPriority] = useState<OrderPriority>('Media')
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const suggestedId = useMemo(() => {
    const nums = orders
      .map((o) => parseInt(o.id.replace(/\D/g, ''), 10))
      .filter((n) => !Number.isNaN(n))
    const next = (nums.length ? Math.max(...nums) : 127) + 1
    return `OT-2026-${String(next).padStart(4, '0')}`
  }, [orders])

  const reset = () => {
    setStep(1)
    setClient('')
    setAddress('')
    setService('')
    setIncidentType('Obstrucción')
    setPriority('Media')
    setNotes('')
    setErrors({})
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const validateStep2 = () => {
    const next: Record<string, string> = {}
    if (!client.trim()) next.client = 'Cliente es obligatorio'
    if (!address.trim()) next.address = 'Dirección es obligatoria'
    if (!service.trim()) next.service = 'Descripción del servicio es obligatoria'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const buildOrder = (): WorkOrder => {
    const today = new Date().toLocaleDateString('es-CL')
    return {
      id: suggestedId,
      client: client.trim(),
      address: address.trim(),
      service: service.trim(),
      category: incidentType,
      incidentType,
      status: 'Pendiente',
      createdAt: today,
      priority,
      priorityManual: priority === 'Urgente' || priority === 'Alta',
      technician: currentUser.name ?? 'Operador',
      operatorIds: currentUser.id ? [currentUser.id] : [],
      operators: currentUser.id
        ? [{ id: currentUser.id, name: currentUser.name ?? 'Operador' }]
        : [],
      progress: 0,
      sortOrder: 0,
    }
  }

  const handleSaveDraft = () => {
    if (!validateStep2()) return
    if (offlineMode) {
      queueOfflineEntry({
        module: 'Órdenes',
        summary: `Borrador OT terreno ${suggestedId} — ${client.trim()}`,
      })
      addToast('Información registrada temporalmente en el dispositivo', 'info')
    } else {
      addToast('Formulario guardado temporalmente. Complete el registro para enviar.', 'info')
    }
  }

  const handleSubmit = () => {
    if (!validateStep2()) return
    const order = buildOrder()
    if (offlineMode) {
      queueOfflineEntry({
        module: 'Órdenes',
        summary: `OT terreno ${order.id} — ${order.client}`,
      })
      addToast('Orden guardada localmente. Sincronice cuando recupere conexión.', 'info')
      handleClose()
      return
    }
    addOrder(order)
    addToast('Registro exitoso: orden de trabajo creada desde terreno')
    handleClose()
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={step === 1 ? 'Registrar orden de trabajo' : 'Completar formulario en terreno'}
      description={
        step === 1
          ? 'CU-147 — Registro de orden desde el lugar del servicio.'
          : 'CU-148 — Complete los datos antes de confirmar el registro.'
      }
      size="md"
      footer={
        step === 1 ? (
          <>
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button onClick={() => setStep(2)}>Continuar al formulario</Button>
          </>
        ) : (
          <>
            <Button variant="outline" onClick={() => setStep(1)}>
              Volver
            </Button>
            <Button variant="outline" onClick={handleSaveDraft}>
              Guardar temporalmente
            </Button>
            <Button onClick={handleSubmit}>Finalizar registro</Button>
          </>
        )
      }
    >
      {step === 1 ? (
        <div className="space-y-4">
          <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
            Operador: <strong>{currentUser.name ?? 'Operador'}</strong>
            {offlineMode && (
              <p className="mt-2 text-blue-800">Modo sin conexión activo: los datos se guardarán localmente.</p>
            )}
          </div>
          <p className="text-sm text-slate-600">
            Ingrese a registrar una nueva orden de trabajo mientras ejecuta el servicio en terreno.
          </p>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <ClipboardList className="h-4 w-4" />
            ID sugerido: <strong className="text-slate-800">{suggestedId}</strong>
          </div>
        </div>
      ) : (
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
            <Input value={service} onChange={(e) => setService(e.target.value)} placeholder="Ej. Desobstrucción de ducto" />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Tipo de incidente">
              <Select value={incidentType} onChange={(e) => setIncidentType(e.target.value as IncidentType)}>
                {INCIDENT_TYPES.map((t) => (
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
              placeholder="Detalle adicional del trabajo en terreno..."
            />
          </FormField>
        </div>
      )}
    </Modal>
  )
}
