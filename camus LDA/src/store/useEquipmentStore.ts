import { create } from 'zustand'
import type { Equipment, EquipmentStatus, WorkOrder } from '@/types'
import { machineryService } from '@/services/machineryService'
import { buildActiveEquipmentAssignments } from '@/features/inventory/utils/equipmentOrderAssignments'

interface EquipmentState {
  equipment: Equipment[]
  apiAvailable: boolean
  loading: boolean
  syncFromApi: () => Promise<void>
  addEquipment: (
    data: Omit<Equipment, 'id' | 'assignedOrderId'> & {
      patente?: string
      marca?: string
      purchaseDate?: string
    },
  ) => Promise<{ ok: boolean; message?: string }>
  updateEquipment: (
    id: string,
    data: Partial<
      Pick<
        Equipment,
        | 'status'
        | 'lastMaintenance'
        | 'nextMaintenance'
        | 'assignedTo'
        | 'assignedOrderId'
        | 'location'
        | 'name'
        | 'category'
        | 'patente'
        | 'marca'
        | 'purchaseDate'
        | 'serialNumber'
      >
    >,
  ) => Promise<{ ok: boolean; message?: string }>
  deleteEquipment: (id: string) => Promise<{ ok: boolean; message?: string }>
  /** Actualiza ubicaciones según OT activas (asignar → dirección OT; liberar → base) */
  syncLocationsFromOrders: (
    orders: Array<{ id: string; status: string; address: string; truckCode?: string; equipmentId?: string }>,
  ) => Promise<void>
  setLocalStatus: (id: string, status: EquipmentStatus) => void
}

export const useEquipmentStore = create<EquipmentState>((set, get) => ({
  equipment: [],
  apiAvailable: false,
  loading: false,

  syncFromApi: async () => {
    set({ loading: true })
    try {
      const equipment = await machineryService.list()
      set({
        equipment,
        apiAvailable: true,
        loading: false,
      })
    } catch {
      set({ equipment: [], apiAvailable: false, loading: false })
    }
  },

  addEquipment: async (data) => {
    try {
      const created = await machineryService.create({
        code: data.code,
        name: data.name,
        category: data.category,
        status: data.status,
        serialNumber: data.serialNumber,
        location: data.location,
        assignedTo: data.assignedTo ?? null,
        patente: data.patente,
        marca: data.marca,
        purchaseDate: data.purchaseDate,
        lastMaintenance: data.lastMaintenance,
        nextMaintenance: data.nextMaintenance,
      })
      set((s) => ({
        equipment: [created, ...s.equipment.filter((e) => e.code !== created.code)],
        apiAvailable: true,
      }))
      return { ok: true }
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? String(
              (err as { response?: { data?: { error?: string } } }).response?.data
                ?.error ?? 'No se pudo registrar el vehículo',
            )
          : 'No se pudo registrar el vehículo'
      return { ok: false, message }
    }
  },

  updateEquipment: async (id, data) => {
    const current = get().equipment.find((e) => e.id === id)
    if (!current) return { ok: false, message: 'Equipo no encontrado' }

    const previous = { ...current }
    const optimistic: Equipment = {
      ...current,
      ...data,
      ...(data.status === 'Mantenimiento' || data.status === 'Fuera de servicio'
        ? { assignedOrderId: undefined, assignedTo: undefined }
        : {}),
    }
    set((s) => ({
      equipment: s.equipment.map((e) => (e.id === id ? optimistic : e)),
    }))

    try {
      const updated = await machineryService.update(id, {
        status: data.status,
        lastMaintenance: data.lastMaintenance,
        nextMaintenance: data.nextMaintenance,
        assignedTo: optimistic.assignedTo ?? null,
        location: data.location,
        name: data.name,
        category: data.category,
        patente: data.patente,
        marca: data.marca,
        purchaseDate: data.purchaseDate,
        serialNumber: data.serialNumber,
      })
      set((s) => ({
        equipment: s.equipment.map((e) => (e.id === id ? updated : e)),
        apiAvailable: true,
      }))
      return { ok: true }
    } catch (err) {
      set((s) => ({
        equipment: s.equipment.map((e) => (e.id === id ? previous : e)),
        apiAvailable: false,
      }))
      const message =
        err && typeof err === 'object' && 'response' in err
          ? String(
              (err as { response?: { data?: { error?: string } } }).response?.data
                ?.error ?? 'No se pudo actualizar la maquinaria',
            )
          : 'No se pudo actualizar la maquinaria'
      return { ok: false, message }
    }
  },

  deleteEquipment: async (id) => {
    const previous = get().equipment
    set((s) => ({ equipment: s.equipment.filter((e) => e.id !== id) }))
    try {
      await machineryService.remove(id)
      set({ apiAvailable: true })
      return { ok: true }
    } catch (err) {
      set({ equipment: previous, apiAvailable: false })
      const message =
        err && typeof err === 'object' && 'response' in err
          ? String(
              (err as { response?: { data?: { error?: string } } }).response?.data
                ?.error ?? 'No se pudo eliminar la maquinaria',
            )
          : 'No se pudo eliminar la maquinaria'
      return { ok: false, message }
    }
  },

  syncLocationsFromOrders: async (orders) => {
    const equipment = get().equipment
    const assignments = buildActiveEquipmentAssignments(
      orders as WorkOrder[],
      equipment,
    )
    try {
      const updated = await machineryService.syncAssignments(assignments)
      if (Array.isArray(updated) && updated.length > 0) {
        // Preferir listado completo si el backend lo devolvió tras sync
        const list =
          updated.length >= equipment.length
            ? updated
            : await machineryService.list()
        set({ equipment: list, apiAvailable: true })
        return
      }
      const list = await machineryService.list()
      set({ equipment: list, apiAvailable: true })
    } catch {
      // Fallback local: refleja ubicación OT / base sin API
      const assignedCodes = new Set(
        assignments.map((a) => a.code.trim().toUpperCase()),
      )
      const byCode = new Map(
        assignments.map((a) => [a.code.trim().toUpperCase(), a]),
      )
      set((s) => ({
        equipment: s.equipment.map((eq) => {
          const key = eq.code.trim().toUpperCase()
          const a = byCode.get(key)
          if (a) {
            return {
              ...eq,
              baseLocation: eq.baseLocation || eq.location,
              location: `${
                /^ot[\s_-]/i.test(a.orderId.trim())
                  ? a.orderId.trim()
                  : `OT ${a.orderId.trim()}`
              } — ${a.address}`.slice(0, 150),
              status:
                eq.status === 'Mantenimiento' || eq.status === 'Fuera de servicio'
                  ? eq.status
                  : 'Asignado',
              assignedOrderId: a.orderId,
              assignedTo: a.orderId,
            }
          }
          if (
            assignedCodes.has(key) ||
            (!/^ot[\s_-]/i.test(eq.location.trim()) && eq.status !== 'Asignado')
          ) {
            return eq
          }
          const base = eq.baseLocation || eq.location.replace(/^OT .+?—\s*/, '') || eq.location
          return {
            ...eq,
            location: base,
            baseLocation: base,
            status: eq.status === 'Asignado' ? 'Operativo' : eq.status,
            assignedOrderId: undefined,
            assignedTo: undefined,
          }
        }),
        apiAvailable: false,
      }))
    }
  },

  setLocalStatus: (id, status) =>
    set((s) => ({
      equipment: s.equipment.map((e) =>
        e.id === id
          ? {
              ...e,
              status,
              ...(status === 'Mantenimiento' || status === 'Fuera de servicio'
                ? { assignedOrderId: undefined, assignedTo: undefined }
                : {}),
            }
          : e,
      ),
    })),
}))
