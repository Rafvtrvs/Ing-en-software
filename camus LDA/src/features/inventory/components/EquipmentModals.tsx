import { useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { FormGrid } from '@/components/ui/FormGrid'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { useEquipmentStore } from '@/store/useEquipmentStore'
import { useInventoryStore } from '@/store/useInventoryStore'
import { useNotificationsStore } from '@/store/useNotificationsStore'
import { useOrdersStore } from '@/store/useOrdersStore'
import { formatShortDate } from '@/utils/formatters'
import type { Equipment, EquipmentStatus } from '@/types'

const STATUS_OPTIONS: EquipmentStatus[] = [
  'Operativo',
  'Asignado',
  'Mantenimiento',
  'Fuera de servicio',
]

function isEquipmentInActiveOrder(
  equipment: Equipment,
  orders: ReturnType<typeof useOrdersStore.getState>['orders'],
): { active: boolean; orderId?: string } {
  if (equipment.assignedOrderId) {
    const o = orders.find((ord) => ord.id === equipment.assignedOrderId)
    if (o && (o.status === 'Pendiente' || o.status === 'En Curso')) {
      return { active: true, orderId: o.id }
    }
  }
  const linked = orders.find(
    (ord) =>
      (ord.status === 'Pendiente' || ord.status === 'En Curso') &&
      (ord.equipmentId === equipment.id || ord.truckCode === equipment.code),
  )
  if (linked) return { active: true, orderId: linked.id }
  return { active: false }
}

interface EquipmentViewModalProps {
  equipment: Equipment | null
  open: boolean
  onClose: () => void
  onEdit?: (equipment: Equipment) => void
}

export function EquipmentViewModal({
  equipment,
  open,
  onClose,
  onEdit,
}: EquipmentViewModalProps) {
  if (!equipment) return null

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Detalle de maquinaria"
      description={`${equipment.code} — ${equipment.name}`}
      size="lg"
      footer={
        <>
          <Button variant="outline" type="button" onClick={onClose}>
            Cerrar
          </Button>
          {onEdit ? (
            <Button
              type="button"
              onClick={() => {
                onClose()
                onEdit(equipment)
              }}
            >
              Editar
            </Button>
          ) : null}
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            label={equipment.status}
            className={
              equipment.status === 'Operativo'
                ? 'bg-emerald-50 text-emerald-700'
                : equipment.status === 'Asignado'
                  ? 'bg-blue-50 text-blue-700'
                  : equipment.status === 'Mantenimiento'
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-red-50 text-red-700'
            }
          />
          <span className="text-sm text-slate-500">{equipment.category}</span>
        </div>

        <FormGrid cols={2}>
          <DetailItem label="Código" value={equipment.code} />
          <DetailItem label="Nombre" value={equipment.name} />
          <DetailItem label="N° serie" value={equipment.serialNumber || '—'} />
          <DetailItem label="Ubicación actual" value={equipment.location || '—'} />
          <DetailItem
            label="Ubicación base"
            value={equipment.baseLocation || '—'}
          />
          <DetailItem label="Patente" value={equipment.patente || '—'} />
          <DetailItem label="Marca" value={equipment.marca || '—'} />
          <DetailItem
            label="Fecha de compra"
            value={equipment.purchaseDate ? formatShortDate(equipment.purchaseDate) : '—'}
          />
          <DetailItem label="Asignado a" value={equipment.assignedTo || '—'} />
          <DetailItem
            label="Última mantención"
            value={formatShortDate(equipment.lastMaintenance)}
          />
          <DetailItem
            label="Próxima mantención"
            value={formatShortDate(equipment.nextMaintenance)}
          />
          <DetailItem label="OT asociada" value={equipment.assignedOrderId || '—'} />
        </FormGrid>
      </div>
    </Modal>
  )
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-slate-900">{value}</p>
    </div>
  )
}

interface EquipmentEditModalProps {
  equipment: Equipment | null
  open: boolean
  onClose: () => void
  onSaved?: (from: EquipmentStatus, to: EquipmentStatus) => void
}

export function EquipmentEditModal({
  equipment,
  open,
  onClose,
  onSaved,
}: EquipmentEditModalProps) {
  const updateEquipment = useEquipmentStore((s) => s.updateEquipment)
  const addToast = useInventoryStore((s) => s.addToast)
  const orders = useOrdersStore((s) => s.orders)
  const updateOrder = useOrdersStore((s) => s.updateOrder)
  const pushEquipmentUnavailable = useNotificationsStore(
    (s) => s.pushEquipmentUnavailable,
  )

  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState<EquipmentStatus>('Operativo')
  const [serialNumber, setSerialNumber] = useState('')
  const [location, setLocation] = useState('')
  const [patente, setPatente] = useState('')
  const [marca, setMarca] = useState('')
  const [purchaseDate, setPurchaseDate] = useState('')
  const [lastMaintenance, setLastMaintenance] = useState('')
  const [nextMaintenance, setNextMaintenance] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open || !equipment) return
    setName(equipment.name)
    setCategory(equipment.category)
    setStatus(equipment.status)
    setSerialNumber(equipment.serialNumber === '—' ? '' : equipment.serialNumber)
    setLocation(
      equipment.baseLocation ||
        (/^ot[\s_-]/i.test(equipment.location.trim())
          ? ''
          : equipment.location === '—'
            ? ''
            : equipment.location),
    )
    setPatente(equipment.patente ?? '')
    setMarca(equipment.marca ?? '')
    setPurchaseDate(equipment.purchaseDate ?? '')
    setLastMaintenance(equipment.lastMaintenance)
    setNextMaintenance(equipment.nextMaintenance)
    setAssignedTo(equipment.assignedTo ?? '')
  }, [open, equipment])

  if (!equipment) return null

  const handleSave = async () => {
    if (!name.trim()) {
      addToast('El nombre es obligatorio', 'error')
      return
    }

    const statusChanged = status !== equipment.status
    if (statusChanged) {
      const active = isEquipmentInActiveOrder(equipment, orders)
      if (active.active) {
        addToast(
          `No se puede cambiar el estado: el equipo está en una orden activa (${active.orderId}).`,
          'error',
        )
        return
      }
    }

    const becomesUnavailable =
      statusChanged && (status === 'Fuera de servicio' || status === 'Mantenimiento')

    setSaving(true)
    const result = await updateEquipment(equipment.id, {
      name: name.trim(),
      category: category.trim(),
      status,
      serialNumber: serialNumber.trim(),
      location: location.trim(),
      patente: patente.trim().toUpperCase(),
      marca: marca.trim(),
      purchaseDate,
      lastMaintenance,
      nextMaintenance,
      assignedTo: assignedTo.trim() || undefined,
      ...(becomesUnavailable
        ? { assignedOrderId: undefined, assignedTo: undefined }
        : {}),
    })
    setSaving(false)

    if (!result.ok) {
      addToast(result.message ?? 'No se pudo actualizar el equipo', 'error')
      return
    }

    if (becomesUnavailable) {
      pushEquipmentUnavailable({
        code: equipment.code,
        name: name.trim(),
        status,
      })
      if (equipment.assignedOrderId) {
        updateOrder(equipment.assignedOrderId, { equipmentId: undefined })
      }
    }

    onSaved?.(equipment.status, status)
    addToast(`Equipo "${equipment.code}" actualizado`, 'success')
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Editar maquinaria"
      description="Actualiza los campos del equipo o vehículo."
      size="lg"
      footer={
        <>
          <Button variant="outline" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" onClick={() => void handleSave()} disabled={saving}>
            Guardar
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3 text-sm text-slate-600">
          Código: <span className="font-semibold text-slate-900">{equipment.code}</span>
        </div>

        <FormGrid cols={2}>
          <FormField label="Nombre" htmlFor="eq-name" required>
            <Input id="eq-name" value={name} onChange={(e) => setName(e.target.value)} />
          </FormField>
          <FormField label="Categoría" htmlFor="eq-category">
            <Input
              id="eq-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Ej: Vehículos"
            />
          </FormField>
        </FormGrid>

        <FormGrid cols={2}>
          <FormField label="Estado" htmlFor="eq-status" required>
            <Select
              id="eq-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as EquipmentStatus)}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Asignado a" htmlFor="eq-assigned">
            <Input
              id="eq-assigned"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              placeholder="Operador o unidad"
            />
          </FormField>
        </FormGrid>

        <FormGrid cols={2}>
          <FormField label="Patente" htmlFor="eq-patente">
            <Input
              id="eq-patente"
              value={patente}
              onChange={(e) => setPatente(e.target.value)}
              placeholder="ABCD-12"
            />
          </FormField>
          <FormField label="Marca" htmlFor="eq-marca">
            <Input
              id="eq-marca"
              value={marca}
              onChange={(e) => setMarca(e.target.value)}
              placeholder="Isuzu"
            />
          </FormField>
        </FormGrid>

        <FormGrid cols={2}>
          <FormField label="N° serie" htmlFor="eq-serial">
            <Input
              id="eq-serial"
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
            />
          </FormField>
          <FormField label="Fecha de compra" htmlFor="eq-purchase">
            <Input
              id="eq-purchase"
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
            />
          </FormField>
        </FormGrid>

        <FormField label="Ubicación base" htmlFor="eq-location">
          <Input
            id="eq-location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Bodega, patio, etc."
          />
          <p className="mt-1 text-xs text-slate-500">
            Al asignar el equipo a una OT, la ubicación mostrada pasa a la dirección
            de la orden. Al liberarlo, vuelve a esta ubicación base.
          </p>
        </FormField>

        <FormGrid cols={2}>
          <FormField label="Última mantención" htmlFor="eq-last">
            <Input
              id="eq-last"
              type="date"
              value={lastMaintenance}
              onChange={(e) => setLastMaintenance(e.target.value)}
            />
          </FormField>
          <FormField label="Próxima mantención" htmlFor="eq-next">
            <Input
              id="eq-next"
              type="date"
              value={nextMaintenance}
              onChange={(e) => setNextMaintenance(e.target.value)}
            />
          </FormField>
        </FormGrid>
      </div>
    </Modal>
  )
}

interface EquipmentDeleteModalProps {
  equipment: Equipment | null
  open: boolean
  onClose: () => void
}

export function EquipmentDeleteModal({
  equipment,
  open,
  onClose,
}: EquipmentDeleteModalProps) {
  const deleteEquipment = useEquipmentStore((s) => s.deleteEquipment)
  const addToast = useInventoryStore((s) => s.addToast)
  const orders = useOrdersStore((s) => s.orders)
  const [deleting, setDeleting] = useState(false)

  if (!equipment) return null

  const handleDelete = async () => {
    const active = isEquipmentInActiveOrder(equipment, orders)
    if (active.active) {
      addToast(
        `No se puede eliminar: el equipo está en una orden activa (${active.orderId}).`,
        'error',
      )
      return
    }

    setDeleting(true)
    const result = await deleteEquipment(equipment.id)
    setDeleting(false)
    if (!result.ok) {
      addToast(result.message ?? 'No se pudo eliminar', 'error')
      return
    }
    addToast(`Equipo "${equipment.code}" eliminado`, 'info')
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Eliminar maquinaria"
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            className="bg-red-600 hover:bg-red-700"
            onClick={() => void handleDelete()}
            disabled={deleting}
          >
            Eliminar
          </Button>
        </>
      }
    >
      <div className="flex flex-col items-center gap-4 py-2 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
          <AlertTriangle className="h-7 w-7 text-red-500" />
        </div>
        <p className="font-medium text-slate-900">
          ¿Eliminar <strong>{equipment.name}</strong> ({equipment.code})?
        </p>
        <p className="text-sm text-slate-500">Esta acción no se puede deshacer.</p>
      </div>
    </Modal>
  )
}
