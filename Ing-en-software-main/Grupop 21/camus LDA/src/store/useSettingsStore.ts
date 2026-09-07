import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { defaultAppConfiguration } from '@/data/mock/settings'
import { useAppStore } from '@/store/useAppStore'
import type {
  AppAppearanceSettings,
  AppConfiguration,
  PlatformSystemSettings,
  SecuritySettings,
  SettingsTab,
  UserProfileSettings,
} from '@/types'

export interface ToastMessage {
  id: number
  type: 'success' | 'error' | 'info'
  message: string
}

interface SettingsState {
  config: AppConfiguration
  activeTab: SettingsTab
  toasts: ToastMessage[]
  setActiveTab: (tab: SettingsTab) => void
  updateProfile: (data: Partial<UserProfileSettings>) => void
  updateAppearance: (data: Partial<AppAppearanceSettings>) => void
  updateSecurity: (data: Partial<SecuritySettings>) => void
  updateSystem: (data: Partial<PlatformSystemSettings>) => void
  runBackup: () => void
  clearLocalData: () => void
  addToast: (message: string, type?: ToastMessage['type']) => void
  removeToast: (id: number) => void
}

let toastId = 0

const STORE_KEYS = [
  'camus_clients_store_v1',
  'camus_orders_store_v1',
  'camus_inventory_store_v1',
  'camus_billing_store_v1',
  'camus_users_store_v1',
  'camus_parameters_store_v1',
  'camus_settings_store_v1',
  'camus_support_store_v1',
]

function syncHeaderUser(profile: UserProfileSettings) {
  useAppStore.setState({
    user: {
      name: profile.name,
      role: useAppStore.getState().user.role,
      avatar: profile.avatar,
      notifications: useAppStore.getState().user.notifications,
    },
  })
}

function applyTheme(theme: AppAppearanceSettings['theme']) {
  const root = document.documentElement
  if (theme === 'dark') {
    root.classList.add('dark')
  } else if (theme === 'light') {
    root.classList.remove('dark')
  } else {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    root.classList.toggle('dark', prefersDark)
  }
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      config: defaultAppConfiguration,
      activeTab: 'perfil',
      toasts: [],

      setActiveTab: (tab) => set({ activeTab: tab }),

      updateProfile: (data) => {
        set((state) => {
          const profile = { ...state.config.profile, ...data }
          syncHeaderUser(profile)
          return { config: { ...state.config, profile } }
        })
      },

      updateAppearance: (data) => {
        set((state) => {
          const appearance = { ...state.config.appearance, ...data }
          applyTheme(appearance.theme)
          useAppStore.setState({ sidebarOpen: !appearance.compactSidebar })
          return { config: { ...state.config, appearance } }
        })
      },

      updateSecurity: (data) =>
        set((state) => ({
          config: {
            ...state.config,
            security: { ...state.config.security, ...data },
          },
        })),

      updateSystem: (data) =>
        set((state) => ({
          config: {
            ...state.config,
            system: { ...state.config.system, ...data },
          },
        })),

      runBackup: () => {
        const backup = {
          date: new Date().toISOString(),
          stores: STORE_KEYS.reduce(
            (acc, key) => {
              const raw = localStorage.getItem(key)
              if (raw) acc[key] = JSON.parse(raw)
              return acc
            },
            {} as Record<string, unknown>,
          ),
        }
        const blob = new Blob([JSON.stringify(backup, null, 2)], {
          type: 'application/json',
        })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `backup-camus_${new Date().toISOString().slice(0, 10)}.json`
        link.click()
        URL.revokeObjectURL(url)
        set((state) => ({
          config: {
            ...state.config,
            system: { ...state.config.system, lastBackup: new Date().toISOString() },
          },
        }))
        get().addToast('Copia de seguridad descargada correctamente')
      },

      clearLocalData: () => {
        STORE_KEYS.forEach((key) => localStorage.removeItem(key))
        window.location.reload()
      },

      addToast: (message, type = 'success') => {
        const id = ++toastId
        set((state) => ({ toasts: [...state.toasts, { id, message, type }] }))
        setTimeout(() => {
          useSettingsStore.getState().removeToast(id)
        }, 3500)
      },

      removeToast: (id) =>
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
    }),
    {
      name: 'camus_settings_store_v1',
      partialize: (state) => ({ config: state.config }),
      onRehydrateStorage: () => (state) => {
        if (state?.config.appearance.theme) {
          applyTheme(state.config.appearance.theme)
        }
      },
    },
  ),
)
