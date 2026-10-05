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

type AppearanceSection = 'theme' | 'colors' | 'tables' | 'charts' | 'layout'

interface SettingsState {
  config: AppConfiguration
  activeTab: SettingsTab
  toasts: ToastMessage[]
  /** RF-38 CU-133 — orden de bloques del dashboard */
  dashboardBlockOrder: string[]
  setActiveTab: (tab: SettingsTab) => void
  updateProfile: (data: Partial<UserProfileSettings>) => void
  updateAppearance: (data: Partial<AppAppearanceSettings>) => void
  updateSecurity: (data: Partial<SecuritySettings>) => void
  updateSystem: (data: Partial<PlatformSystemSettings>) => void
  /** RF-37 CU-129 — apariencia de fábrica */
  resetAppearance: () => void
  /** RF-38 CU-131 — restaurar solo una sección visual */
  resetAppearanceSection: (section: AppearanceSection) => void
  /** RF-38 CU-130 — restablecimiento total de preferencias UI */
  factoryResetUi: () => void
  /** RF-38 CU-133 */
  resetDashboardLayout: () => void
  setDashboardBlockOrder: (order: string[]) => void
  runBackup: () => void
  clearLocalData: () => void
  addToast: (message: string, type?: ToastMessage['type']) => void
  removeToast: (id: number) => void
}

let toastId = 0

const STORE_KEYS = [
  'camus_clients_store_v1',
  'camus_orders_store_v1',
  'camus_inventory_store_v2',
  'camus_billing_store_v1',
  'camus_users_store_v1',
  'camus_parameters_store_v1',
  'camus_settings_store_v1',
  'camus_support_store_v1',
]

export const DEFAULT_DASHBOARD_BLOCKS = [
  'kpis',
  'alerts',
  'charts',
  'recent',
  'inventory',
  'finance',
  'availability',
  'actions',
] as const

const FACTORY_APPEARANCE: AppAppearanceSettings = {
  ...defaultAppConfiguration.appearance,
}

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

let systemThemeMql: MediaQueryList | null = null
let systemThemeHandler: ((e: MediaQueryListEvent) => void) | null = null

function stopSystemThemeListener() {
  if (systemThemeMql && systemThemeHandler) {
    systemThemeMql.removeEventListener('change', systemThemeHandler)
  }
  systemThemeMql = null
  systemThemeHandler = null
}

function applyTheme(theme: AppAppearanceSettings['theme']) {
  const root = document.documentElement
  stopSystemThemeListener()

  if (theme === 'dark') {
    root.classList.add('dark')
    return
  }
  if (theme === 'light') {
    root.classList.remove('dark')
    return
  }

  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  root.classList.toggle('dark', mq.matches)
  systemThemeHandler = (e) => {
    const current = useSettingsStore.getState().config.appearance.theme
    if (current === 'system') {
      root.classList.toggle('dark', e.matches)
    }
  }
  mq.addEventListener('change', systemThemeHandler)
  systemThemeMql = mq
}

function darkenHex(hex: string, amount = 0.15): string {
  const raw = hex.replace('#', '')
  const full =
    raw.length === 3
      ? raw
          .split('')
          .map((c) => c + c)
          .join('')
      : raw
  if (!/^[0-9a-f]{6}$/i.test(full)) return hex
  const num = parseInt(full, 16)
  const r = Math.max(0, Math.round(((num >> 16) & 255) * (1 - amount)))
  const g = Math.max(0, Math.round(((num >> 8) & 255) * (1 - amount)))
  const b = Math.max(0, Math.round((num & 255) * (1 - amount)))
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

/** Aplica variables CSS de acento / tablas (RF-37) */
export function applyAppearanceVars(appearance: AppAppearanceSettings) {
  const root = document.documentElement
  applyTheme(appearance.theme)
  root.style.setProperty('--color-primary', appearance.accentColor)
  root.style.setProperty('--color-primary-hover', darkenHex(appearance.accentColor))
  root.style.setProperty('--color-sidebar-active', appearance.accentColor)
  root.dataset.zebraTables = appearance.zebraTables ? 'true' : 'false'
  root.dataset.highContrastTables = appearance.highContrastTables
    ? 'true'
    : 'false'
  root.dataset.chartPalette = appearance.chartPalette
}

/** RF-38 CU-132 — si la config viene corrupta, vuelve a fábrica */
export function sanitizeAppearance(
  raw: Partial<AppAppearanceSettings> | undefined,
): AppAppearanceSettings {
  try {
    if (!raw || typeof raw !== 'object') return { ...FACTORY_APPEARANCE }
    const theme = raw.theme
    if (theme && !['light', 'dark', 'system'].includes(theme)) {
      throw new Error('tema inválido')
    }
    return {
      ...FACTORY_APPEARANCE,
      ...raw,
      accentColor:
        typeof raw.accentColor === 'string' && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(raw.accentColor)
          ? raw.accentColor
          : FACTORY_APPEARANCE.accentColor,
      chartPalette: (['default', 'ocean', 'forest', 'sunset'] as const).includes(
        raw.chartPalette as AppAppearanceSettings['chartPalette'],
      )
        ? (raw.chartPalette as AppAppearanceSettings['chartPalette'])
        : 'default',
      // CU-127: si el storage viejo no traía flags, quedan activos por defecto
      zebraTables:
        typeof raw.zebraTables === 'boolean'
          ? raw.zebraTables
          : FACTORY_APPEARANCE.zebraTables,
      highContrastTables:
        typeof raw.highContrastTables === 'boolean'
          ? raw.highContrastTables
          : FACTORY_APPEARANCE.highContrastTables,
    }
  } catch {
    return { ...FACTORY_APPEARANCE }
  }
}

export const CHART_PALETTES: Record<
  AppAppearanceSettings['chartPalette'],
  string[]
> = {
  default: ['#3b82f6', '#eab308', '#22c55e', '#8b5cf6', '#94a3b8', '#f97316'],
  ocean: ['#0ea5e9', '#0284c7', '#0369a1', '#38bdf8', '#7dd3fc', '#bae6fd'],
  forest: ['#16a34a', '#15803d', '#65a30d', '#84cc16', '#a3e635', '#4d7c0f'],
  sunset: ['#f97316', '#ea580c', '#e11d48', '#f43f5e', '#fb923c', '#fdba74'],
}

export function getActiveChartPalette(): string[] {
  const palette =
    useSettingsStore.getState().config.appearance.chartPalette ?? 'default'
  return CHART_PALETTES[palette] ?? CHART_PALETTES.default
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      config: defaultAppConfiguration,
      activeTab: 'perfil',
      toasts: [],
      dashboardBlockOrder: [...DEFAULT_DASHBOARD_BLOCKS],

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
          const appearance = sanitizeAppearance({
            ...state.config.appearance,
            ...data,
          })
          applyAppearanceVars(appearance)
          // Solo colapsa el menú si el usuario pide barra compacta;
          // no fuerza cierre en cada carga (mantiene vista PC usable).
          if (appearance.compactSidebar) {
            useAppStore.setState({ sidebarOpen: false })
          }
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

      resetAppearance: () => {
        get().updateAppearance({ ...FACTORY_APPEARANCE })
        get().addToast('Apariencia restablecida a valores de fábrica')
      },

      resetAppearanceSection: (section) => {
        const current = get().config.appearance
        if (section === 'theme') {
          get().updateAppearance({ theme: FACTORY_APPEARANCE.theme })
        } else if (section === 'colors') {
          get().updateAppearance({ accentColor: FACTORY_APPEARANCE.accentColor })
        } else if (section === 'tables') {
          get().updateAppearance({
            zebraTables: FACTORY_APPEARANCE.zebraTables,
            highContrastTables: FACTORY_APPEARANCE.highContrastTables,
          })
        } else if (section === 'charts') {
          get().updateAppearance({
            chartPalette: FACTORY_APPEARANCE.chartPalette,
          })
        } else {
          get().updateAppearance({
            compactSidebar: FACTORY_APPEARANCE.compactSidebar,
          })
        }
        void current
        get().addToast(`Sección “${section}” restaurada`, 'info')
      },

      factoryResetUi: () => {
        get().updateAppearance({ ...FACTORY_APPEARANCE })
        set({ dashboardBlockOrder: [...DEFAULT_DASHBOARD_BLOCKS] })
        get().addToast('Restablecimiento total de interfaz aplicado')
      },

      resetDashboardLayout: () => {
        set({ dashboardBlockOrder: [...DEFAULT_DASHBOARD_BLOCKS] })
        get().addToast('Posición de módulos del dashboard restaurada')
      },

      setDashboardBlockOrder: (order) => set({ dashboardBlockOrder: order }),

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
      name: 'camus_settings_store_v2',
      partialize: (state) => ({
        config: state.config,
        dashboardBlockOrder: state.dashboardBlockOrder,
      }),
      onRehydrateStorage: () => (state, error) => {
        // RF-38 CU-132: ante error de carga, fábrica
        if (error || !state) {
          try {
            applyAppearanceVars(FACTORY_APPEARANCE)
          } catch {
            /* ignore */
          }
          return
        }
        try {
          const appearance = sanitizeAppearance(state.config.appearance)
          state.config.appearance = appearance
          applyAppearanceVars(appearance)
          // Vista escritorio usable al iniciar (menú visible)
          queueMicrotask(() => {
            useAppStore.setState({ sidebarOpen: true })
          })
        } catch {
          state.config.appearance = { ...FACTORY_APPEARANCE }
          applyAppearanceVars(FACTORY_APPEARANCE)
          queueMicrotask(() => {
            useAppStore.setState({ sidebarOpen: true })
            useSettingsStore
              .getState()
              .addToast(
                'Preferencias corruptas: se restableció la apariencia',
                'info',
              )
          })
        }
      },
    },
  ),
)
