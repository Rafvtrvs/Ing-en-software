import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { initialRoles, initialSystemUsers } from '@/data/mock/users'
import { initialUserLifecycleEvents } from '@/data/mock/userLifecycle'
import { initialRoleAssignmentEvents } from '@/data/mock/roleAssignments'
import type { AppRole, RoleAssignmentEvent, SystemUser, SystemUserStatus, UserLifecycleEvent, UsersTab } from '@/types'

export type UserModalMode = 'create' | 'edit' | 'view' | 'delete' | 'deactivate' | 'reactivate' | 'assignRole' | null
export type RoleModalMode = 'create' | 'edit' | 'view' | 'delete' | null

export interface ToastMessage {
  id: number
  type: 'success' | 'error' | 'info'
  message: string
}

interface UsersState {
  users: SystemUser[]
  roles: AppRole[]
  lifecycleHistory: UserLifecycleEvent[]
  roleAssignmentHistory: RoleAssignmentEvent[]
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
  deleteUser: (id: string, performedBy: { id: string; name: string }) => void
  deactivateUser: (id: string, performedBy: { id: string; name: string }) => void
  reactivateUser: (id: string, performedBy: { id: string; name: string }) => void
  assignRoleToUser: (
    userId: string,
    roleId: string,
    performedBy: { id: string; name: string },
  ) => { ok: true } | { ok: false; message: string }
  addRoleAssignmentEvent: (event: Omit<RoleAssignmentEvent, 'id'>) => void
  addLifecycleEvent: (event: Omit<UserLifecycleEvent, 'id'>) => void
  addRole: (role: Omit<AppRole, 'id'>) => void
  updateRole: (id: string, data: Partial<Omit<AppRole, 'id'>>) => void
  deleteRole: (id: string) => boolean
  setActiveTab: (tab: UsersTab) => void
  openUserCreateModal: () => void
  openUserEditModal: (user: SystemUser) => void
  openUserViewModal: (user: SystemUser) => void
  openUserDeleteModal: (user: SystemUser) => void
  openUserDeactivateModal: (user: SystemUser) => void
  openUserReactivateModal: (user: SystemUser) => void
  openAssignRoleModal: (user: SystemUser) => void
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
      lifecycleHistory: initialUserLifecycleEvents,
      roleAssignmentHistory: initialRoleAssignmentEvents,
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
              createdAt: new Date().toISOString().slice(0, 10),
              avatar:
                user.avatar ??
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name)}`,
            },
            ...state.users,
          ],
        })),

      addLifecycleEvent: (event) =>
        set((state) => ({
          lifecycleHistory: [{ ...event, id: safeId() }, ...state.lifecycleHistory],
        })),

      addRoleAssignmentEvent: (event) =>
        set((state) => ({
          roleAssignmentHistory: [{ ...event, id: safeId() }, ...state.roleAssignmentHistory],
        })),

      assignRoleToUser: (userId, roleId, performedBy) => {
        const user = get().users.find((u) => u.id === userId)
        if (!user) return { ok: false, message: 'Usuario no encontrado' }
        if (user.status !== 'Activo') {
          return { ok: false, message: 'Solo usuarios activos pueden recibir asignación de rol' }
        }
        const role = get().roles.find((r) => r.id === roleId)
        if (!role) return { ok: false, message: 'Rol no encontrado' }
        if (role.status !== 'Activo') {
          return { ok: false, message: 'El rol seleccionado no está activo' }
        }
        if (user.roleId === roleId) {
          return { ok: false, message: 'El usuario ya tiene ese rol asignado' }
        }

        const previousRole = get().roles.find((r) => r.id === user.roleId)
        get().updateUser(userId, { roleId })
        get().addRoleAssignmentEvent({
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          previousRoleId: previousRole?.id ?? null,
          previousRoleName: previousRole?.name ?? null,
          newRoleId: role.id,
          newRoleName: role.name,
          performedBy: performedBy.id,
          performedByName: performedBy.name,
          performedAt: new Date().toISOString(),
        })
        return { ok: true }
      },

      deleteUser: (id, performedBy) => {
        const user = get().users.find((u) => u.id === id)
        if (!user) return
        get().addLifecycleEvent({
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          action: 'eliminado',
          performedBy: performedBy.id,
          performedByName: performedBy.name,
          performedAt: new Date().toISOString(),
        })
        set((state) => ({
          users: state.users.filter((u) => u.id !== id),
          selectedUser: state.selectedUser?.id === id ? null : state.selectedUser,
          userModalMode: state.selectedUser?.id === id ? null : state.userModalMode,
        }))
      },

      deactivateUser: (id, performedBy) => {
        const now = new Date().toISOString()
        const user = get().users.find((u) => u.id === id)
        if (!user) return
        get().updateUser(id, { status: 'Inactivo', deactivatedAt: now })
        get().addLifecycleEvent({
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          action: 'desactivado',
          performedBy: performedBy.id,
          performedByName: performedBy.name,
          performedAt: now,
        })
      },

      reactivateUser: (id, performedBy) => {
        const user = get().users.find((u) => u.id === id)
        if (!user) return
        get().updateUser(id, { status: 'Activo', deactivatedAt: undefined })
        get().addLifecycleEvent({
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          action: 'reactivado',
          performedBy: performedBy.id,
          performedByName: performedBy.name,
          performedAt: new Date().toISOString(),
        })
      },

      updateUser: (id, data) =>
        set((state) => ({
          users: state.users.map((u) => (u.id === id ? { ...u, ...data } : u)),
          selectedUser:
            state.selectedUser?.id === id
              ? { ...state.selectedUser, ...data }
              : state.selectedUser,
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
      openUserDeactivateModal: (user) =>
        set({ userModalMode: 'deactivate', selectedUser: user, roleModalMode: null }),
      openUserReactivateModal: (user) =>
        set({ userModalMode: 'reactivate', selectedUser: user, roleModalMode: null }),
      openAssignRoleModal: (user) =>
        set({ userModalMode: 'assignRole', selectedUser: user, roleModalMode: null }),

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
      partialize: (state) => ({
        users: state.users,
        roles: state.roles,
        lifecycleHistory: state.lifecycleHistory,
        roleAssignmentHistory: state.roleAssignmentHistory,
      }),
      merge: (persisted, current) => {
        const p = persisted as Partial<UsersState> | undefined
        const seedHistory = initialUserLifecycleEvents
        const seedAssignments = initialRoleAssignmentEvents
        const mergedHistory =
          p?.lifecycleHistory && p.lifecycleHistory.length > 0
            ? p.lifecycleHistory
            : seedHistory
        const mergedAssignments =
          p?.roleAssignmentHistory && p.roleAssignmentHistory.length > 0
            ? p.roleAssignmentHistory
            : seedAssignments
        return {
          ...current,
          ...p,
          users: p?.users ?? current.users,
          roles: p?.roles ?? current.roles,
          lifecycleHistory: mergedHistory,
          roleAssignmentHistory: mergedAssignments,
        }
      },
    },
  ),
)
