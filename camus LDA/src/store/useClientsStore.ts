import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { clientsList as initialClients } from '@/data/mock/clients'
import { clientsService } from '@/services/clientsService'
import { findDuplicateClient } from '@/features/clients/utils/clientDuplicates'
import type { DuplicateField } from '@/features/clients/utils/clientDuplicates'
import type { Client, ClientStatus } from '@/types'
import axios from 'axios'

export type ClientModalMode = 'create' | 'edit' | 'view' | 'delete' | null

export interface ToastMessage {
  id: number
  type: 'success' | 'error' | 'info'
  message: string
}

interface ClientsState {
  clients: Client[]
  apiAvailable: boolean
  modalMode: ClientModalMode
  selectedClient: Client | null
  statusFilter: ClientStatus | 'all'
  showFilters: boolean
  toasts: ToastMessage[]
  syncFromApi: () => Promise<void>
  addClient: (client: Omit<Client, 'id'>) => Promise<{ ok: boolean; field?: DuplicateField; message?: string }>
  updateClient: (id: string, data: Partial<Omit<Client, 'id'>>) => Promise<{ ok: boolean; field?: DuplicateField; message?: string }>
  deleteClient: (id: string) => void
  openCreateModal: () => void
  openEditModal: (client: Client) => void
  openViewModal: (client: Client) => void
  openDeleteModal: (client: Client) => void
  closeModal: () => void
  setStatusFilter: (status: ClientStatus | 'all') => void
  toggleFilters: () => void
  addToast: (message: string, type?: ToastMessage['type']) => void
  removeToast: (id: number) => void
}

let toastId = 0

function safeId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function apiErrorMessage(err: unknown, fallback: string): { message: string; field?: DuplicateField } {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { error?: string; field?: DuplicateField } | undefined
    if (data?.error) {
      return { message: data.error, field: data.field }
    }
  }
  return { message: fallback }
}

export const useClientsStore = create<ClientsState>()(
  persist(
    (set) => ({
      clients: initialClients.map((c) => ({
        ...c,
        createdAt: c.createdAt ?? '2026-05-01',
      })),
      apiAvailable: false,
      modalMode: null,
      selectedClient: null,
      statusFilter: 'all',
      showFilters: false,
      toasts: [],

      // Intenta cargar desde el backend (PostgreSQL vía API). Si el
      // backend no está disponible, se conserva el estado local (mock),
      // de modo que la aplicación sigue funcionando.
      syncFromApi: async () => {
        try {
          const clients = await clientsService.list()
          set({ clients, apiAvailable: true })
        } catch {
          set({ apiAvailable: false })
        }
      },

      addClient: async (client) => {
        const state = useClientsStore.getState()
        const duplicate = findDuplicateClient(state.clients, {
          rut: client.rut,
          email: client.email,
          phone: client.phone,
        })
        if (duplicate) {
          state.addToast(duplicate.message, 'error')
          return { ok: false, field: duplicate.field, message: duplicate.message }
        }

        const tempId = safeId()
        set((s) => ({
          clients: [{ ...client, id: tempId }, ...s.clients],
        }))

        try {
          const created = await clientsService.create(client)
          set((s) => ({
            clients: s.clients.map((c) => (c.id === tempId ? created : c)),
            apiAvailable: true,
          }))
          return { ok: true }
        } catch (err) {
          set((s) => ({
            clients: s.clients.filter((c) => c.id !== tempId),
          }))
          const apiErr = apiErrorMessage(err, 'No se pudo crear el cliente')
          useClientsStore.getState().addToast(apiErr.message, 'error')
          return { ok: false, field: apiErr.field, message: apiErr.message }
        }
      },

      updateClient: async (id, data) => {
        const state = useClientsStore.getState()
        const current = state.clients.find((c) => c.id === id)
        if (!current) return { ok: false }

        const duplicate = findDuplicateClient(
          state.clients,
          {
            rut: data.rut ?? current.rut,
            email: data.email ?? current.email,
            phone: data.phone ?? current.phone,
          },
          id,
        )
        if (duplicate) {
          state.addToast(duplicate.message, 'error')
          return { ok: false, field: duplicate.field, message: duplicate.message }
        }

        const previous = { ...current }
        set((s) => ({
          clients: s.clients.map((c) => (c.id === id ? { ...c, ...data } : c)),
        }))

        try {
          await clientsService.update(id, data)
          set({ apiAvailable: true })
          return { ok: true }
        } catch (err) {
          set((s) => ({
            clients: s.clients.map((c) => (c.id === id ? previous : c)),
          }))
          const apiErr = apiErrorMessage(err, 'No se pudo actualizar el cliente')
          useClientsStore.getState().addToast(apiErr.message, 'error')
          return { ok: false, field: apiErr.field, message: apiErr.message }
        }
      },

      deleteClient: (id) => {
        set((state) => ({
          clients: state.clients.filter((c) => c.id !== id),
        }))
        clientsService
          .remove(id)
          .then(() => set({ apiAvailable: true }))
          .catch(() => set({ apiAvailable: false }))
      },

      openCreateModal: () => set({ modalMode: 'create', selectedClient: null }),
      openEditModal: (client) =>
        set({ modalMode: 'edit', selectedClient: client }),
      openViewModal: (client) =>
        set({ modalMode: 'view', selectedClient: client }),
      openDeleteModal: (client) =>
        set({ modalMode: 'delete', selectedClient: client }),
      closeModal: () => set({ modalMode: null, selectedClient: null }),

      setStatusFilter: (status) => set({ statusFilter: status }),
      toggleFilters: () => set((state) => ({ showFilters: !state.showFilters })),

      addToast: (message, type = 'success') => {
        const id = ++toastId
        set((state) => ({ toasts: [...state.toasts, { id, message, type }] }))
        setTimeout(() => {
          useClientsStore.getState().removeToast(id)
        }, 3500)
      },

      removeToast: (id) =>
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
    }),
    {
      name: 'camus_clients_store_v1',
      partialize: (state) => ({ clients: state.clients }),
    },
  ),
)
