import { create } from 'zustand'
import type { User } from '@/types'

interface AppState {
  sidebarOpen: boolean
  user: User
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  sidebarOpen: true,
  user: {
    name: 'Juan Pérez',
    role: 'Administrador',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Juan',
    notifications: 3,
  },
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}))
