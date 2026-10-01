import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { FieldTechnician, OfflineSyncEntry } from '@/types'
import { fieldTechnicians as initialTechnicians } from '@/data/mock/operations'
import { initialOfflineSyncEntries } from '@/data/mock/offlineSync'

export interface ToastMessage {
  id: number
  type: 'success' | 'error' | 'info'
  message: string
}

interface OperationsState {
  technicians: FieldTechnician[]
  offlineMode: boolean
  syncEntries: OfflineSyncEntry[]
  lastAutoSyncAt: string | null
  toasts: ToastMessage[]
  updateTechnicianProgress: (id: string, progress: number) => void
  setOfflineMode: (value: boolean) => void
  queueOfflineEntry: (payload: { module: string; summary: string }) => void
  syncPendingEntries: () => { synced: number; failed: number }
  addToast: (message: string, type?: ToastMessage['type']) => void
  removeToast: (id: number) => void
}

let toastId = 0

function safeId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `off-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export const useOperationsStore = create<OperationsState>()(
  persist(
    (set, get) => ({
      technicians: initialTechnicians,
      offlineMode: false,
      syncEntries: initialOfflineSyncEntries,
      lastAutoSyncAt: null,
      toasts: [],

      updateTechnicianProgress: (id, progress) =>
        set((state) => ({
          technicians: state.technicians.map((t) =>
            t.id === id ? { ...t, progress } : t,
          ),
        })),

      setOfflineMode: (value) => {
        set({ offlineMode: value })
        get().addToast(
          value
            ? 'Modo sin conexión activado. La información se guardará localmente.'
            : 'Conexión restaurada. Puede sincronizar los registros pendientes.',
          'info',
        )
      },

      queueOfflineEntry: ({ module, summary }) => {
        const entry: OfflineSyncEntry = {
          id: safeId(),
          module,
          summary,
          status: 'pendiente',
          createdAt: new Date().toISOString(),
        }
        set((state) => ({ syncEntries: [entry, ...state.syncEntries] }))
      },

      syncPendingEntries: () => {
        let synced = 0
        let failed = 0
        const now = new Date().toISOString()
        set((state) => ({
          syncEntries: state.syncEntries.map((e) => {
            if (e.status !== 'pendiente') return e
            if (Math.random() < 0.08) {
              failed += 1
              return {
                ...e,
                status: 'error' as const,
                errorMessage: 'No fue posible sincronizar este registro.',
              }
            }
            synced += 1
            return { ...e, status: 'sincronizado' as const, syncedAt: now }
          }),
          lastAutoSyncAt: now,
        }))
        if (synced > 0) {
          get().addToast(`${synced} registro(s) sincronizado(s) correctamente`)
        }
        if (failed > 0) {
          get().addToast('Algunos registros no pudieron sincronizarse', 'error')
        }
        if (synced === 0 && failed === 0) {
          get().addToast('No hay registros pendientes de sincronización', 'info')
        }
        return { synced, failed }
      },

      addToast: (message, type = 'success') => {
        const id = ++toastId
        set((state) => ({ toasts: [...state.toasts, { id, message, type }] }))
        setTimeout(() => {
          useOperationsStore.getState().removeToast(id)
        }, 3500)
      },

      removeToast: (id) =>
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
    }),
    {
      name: 'camus_operations_store_v2',
      partialize: (state) => ({
        technicians: state.technicians,
        offlineMode: state.offlineMode,
        syncEntries: state.syncEntries,
        lastAutoSyncAt: state.lastAutoSyncAt,
      }),
    },
  ),
)
