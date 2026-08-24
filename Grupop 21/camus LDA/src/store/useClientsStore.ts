import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { clientsList as initialClients } from '@/data/mock/clients'
import { clientsService } from '@/services/clientsService'
import type { Client, ClientStatus } from '@/types'

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
  addClient: (client: Omit<Client, 'id'>) => void
  updateClient: (id: string, data: Partial<Omit<Client, 'id'>>) => void
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

      addClient: (client) => {
        const tempId = safeId()
        set((state) => ({
          clients: [{ ...client, id: tempId }, ...state.clients],
        }))
        // Persistencia best-effort en el backend
        clientsService
          .create(client)
          .then((created) =>
            set((state) => ({
              clients: state.clients.map((c) =>
                c.id === tempId ? created : c,
              ),
              apiAvailable: true,
            })),
          )
          .catch(() => set({ apiAvailable: false }))
      },

      updateClient: (id, data) => {
        set((state) => ({
          clients: state.clients.map((c) =>
            c.id === id ? { ...c, ...data } : c,
          ),
        }))
        clientsService
          .update(id, data)
          .then(() => set({ apiAvailable: true }))
          .catch(() => set({ apiAvailable: false }))
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
