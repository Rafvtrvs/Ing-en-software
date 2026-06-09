import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { initialRoles, initialSystemUsers } from '@/data/mock/users'
import type { AppRole, SystemUser, SystemUserStatus, UsersTab } from '@/types'

export type UserModalMode = 'create' | 'edit' | 'view' | 'delete' | null
export type RoleModalMode = 'create' | 'edit' | 'view' | 'delete' | null

export interface ToastMessage {
  id: number
  type: 'success' | 'error' | 'info'
  message: string
}

interface UsersState {
  users: SystemUser[]
  roles: AppRole[]
  activeTab: UsersTab
  userModalMode: UserModalMode
  roleModalMode: RoleModalMode
  selectedUser: SystemUser | null
  selectedRole: AppRole | null
  statusFilter: SystemUserStatus | 'all'
  roleFilter: string | 'all'
  showFilters: boolean
  toasts: ToastMessage[]
  addUser: (user: Omit<SystemUser, 'id' | 'lastLogin'>) => void
  updateUser: (id: string, data: Partial<Omit<SystemUser, 'id'>>) => void
  deleteUser: (id: string) => void
  addRole: (role: Omit<AppRole, 'id'>) => void
  updateRole: (id: string, data: Partial<Omit<AppRole, 'id'>>) => void
  deleteRole: (id: string) => boolean
  setActiveTab: (tab: UsersTab) => void
  openUserCreateModal: () => void
  openUserEditModal: (user: SystemUser) => void
  openUserViewModal: (user: SystemUser) => void
  openUserDeleteModal: (user: SystemUser) => void
  openRoleCreateModal: () => void
  openRoleEditModal: (role: AppRole) => void
  openRoleViewModal: (role: AppRole) => void
  openRoleDeleteModal: (role: AppRole) => void
  closeUserModal: () => void
  closeRoleModal: () => void
  setStatusFilter: (status: SystemUserStatus | 'all') => void
  setRoleFilter: (roleId: string | 'all') => void
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

export const useUsersStore = create<UsersState>()(
  persist(
    (set, get) => ({
      users: initialSystemUsers,
      roles: initialRoles,
      activeTab: 'usuarios',
      userModalMode: null,
      roleModalMode: null,
      selectedUser: null,
      selectedRole: null,
      statusFilter: 'all',
      roleFilter: 'all',
      showFilters: false,
      toasts: [],

      addUser: (user) =>
        set((state) => ({
          users: [
            {
              ...user,
              id: safeId(),
              lastLogin: '—',
              avatar:
                user.avatar ??
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name)}`,
            },
            ...state.users,
          ],
        })),

      updateUser: (id, data) =>
        set((state) => ({
          users: state.users.map((u) => (u.id === id ? { ...u, ...data } : u)),
          selectedUser:
            state.selectedUser?.id === id
              ? { ...state.selectedUser, ...data }
              : state.selectedUser,
        })),

      deleteUser: (id) =>
        set((state) => ({
          users: state.users.filter((u) => u.id !== id),
        })),

      addRole: (role) =>
        set((state) => ({
          roles: [{ ...role, id: safeId() }, ...state.roles],
        })),

      updateRole: (id, data) =>
        set((state) => ({
          roles: state.roles.map((r) => (r.id === id ? { ...r, ...data } : r)),
          selectedRole:
            state.selectedRole?.id === id
              ? { ...state.selectedRole, ...data }
              : state.selectedRole,
        })),

      deleteRole: (id) => {
        const role = get().roles.find((r) => r.id === id)
        if (!role) return false
        if (role.isSystem) return false
        const inUse = get().users.some((u) => u.roleId === id)
        if (inUse) return false
        set((state) => ({
          roles: state.roles.filter((r) => r.id !== id),
        }))
        return true
      },

      setActiveTab: (tab) => set({ activeTab: tab }),

      openUserCreateModal: () =>
        set({ userModalMode: 'create', selectedUser: null, roleModalMode: null }),
      openUserEditModal: (user) =>
        set({ userModalMode: 'edit', selectedUser: user, roleModalMode: null }),
      openUserViewModal: (user) =>
        set({ userModalMode: 'view', selectedUser: user, roleModalMode: null }),
      openUserDeleteModal: (user) =>
        set({ userModalMode: 'delete', selectedUser: user, roleModalMode: null }),

      openRoleCreateModal: () =>
        set({ roleModalMode: 'create', selectedRole: null, userModalMode: null }),
      openRoleEditModal: (role) =>
        set({ roleModalMode: 'edit', selectedRole: role, userModalMode: null }),
      openRoleViewModal: (role) =>
        set({ roleModalMode: 'view', selectedRole: role, userModalMode: null }),
      openRoleDeleteModal: (role) =>
        set({ roleModalMode: 'delete', selectedRole: role, userModalMode: null }),

      closeUserModal: () => set({ userModalMode: null, selectedUser: null }),
      closeRoleModal: () => set({ roleModalMode: null, selectedRole: null }),

      setStatusFilter: (status) => set({ statusFilter: status }),
      setRoleFilter: (roleId) => set({ roleFilter: roleId }),
      toggleFilters: () => set((state) => ({ showFilters: !state.showFilters })),

      addToast: (message, type = 'success') => {
        const id = ++toastId
        set((state) => ({ toasts: [...state.toasts, { id, message, type }] }))
        setTimeout(() => {
          useUsersStore.getState().removeToast(id)
        }, 3500)
      },

      removeToast: (id) =>
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
    }),
    {
      name: 'camus_users_store_v1',
      partialize: (state) => ({ users: state.users, roles: state.roles }),
    },
  ),
)
