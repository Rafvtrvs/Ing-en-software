import { useMemo, useState } from 'react'
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

export function useFieldOrderRegister() {
  const orders = useOrdersStore((s) => s.orders)
  const addOrder = useOrdersStore((s) => s.addOrder)
  const addToast = useOrdersStore((s) => s.addToast)
  const offlineMode = useOperationsStore((s) => s.offlineMode)
  const queueOfflineEntry = useOperationsStore((s) => s.queueOfflineEntry)
  const currentUser = useSessionUser()

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

  const resetForm = () => {
    setClient('')
    setAddress('')
    setService('')
    setIncidentType('Obstrucción')
    setPriority('Media')
    setNotes('')
    setErrors({})
  }

  const validateForm = () => {
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

  const saveDraft = () => {
    if (!validateForm()) return false
    if (offlineMode) {
      queueOfflineEntry({
        module: 'Órdenes',
        summary: `Borrador OT terreno ${suggestedId} — ${client.trim()}`,
      })
      addToast('Información registrada temporalmente en el dispositivo', 'info')
    } else {
      addToast('Formulario guardado temporalmente. Complete el registro para enviar.', 'info')
    }
    return true
  }

  const submitOrder = () => {
    if (!validateForm()) return false
    const order = buildOrder()
    if (offlineMode) {
      queueOfflineEntry({
        module: 'Órdenes',
        summary: `OT terreno ${order.id} — ${order.client}`,
      })
      addToast('Orden guardada localmente. Sincronice cuando recupere conexión.', 'info')
      resetForm()
      return true
    }
    addOrder(order)
    addToast('Registro exitoso: orden de trabajo creada desde terreno')
    resetForm()
    return true
  }

  return {
    incidentTypes: INCIDENT_TYPES,
    suggestedId,
    currentUser,
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
    validateForm,
    saveDraft,
    submitOrder,
    resetForm,
  }
}
