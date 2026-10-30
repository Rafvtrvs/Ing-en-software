import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/** RF-34 — registro local de accesos al sistema */
export interface AccessLogEntry {
  id: string
  userId: string
  userName: string
  userEmail: string
  role: string
  action: 'login' | 'logout'
  at: string
}

interface AccessLogState {
  entries: AccessLogEntry[]
  recordLogin: (user: {
    id: string
    name: string
    email: string
    role: string
  }) => void
  recordLogout: (user: {
    id: string
    name: string
    email: string
    role: string
  }) => void
}

function safeId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `access-${crypto.randomUUID().slice(0, 8)}`
  }
  return `access-${Date.now()}`
}

export const useAccessLogStore = create<AccessLogState>()(
  persist(
    (set) => ({
      entries: [],

      recordLogin: (user) =>
        set((state) => {
          const entry: AccessLogEntry = {
            id: safeId(),
            userId: user.id,
            userName: user.name,
            userEmail: user.email,
            role: user.role,
            action: 'login',
            at: new Date().toISOString(),
          }
          return { entries: [entry, ...state.entries].slice(0, 200) }
        }),

      recordLogout: (user) =>
        set((state) => {
          const entry: AccessLogEntry = {
            id: safeId(),
            userId: user.id,
            userName: user.name,
            userEmail: user.email,
            role: user.role,
            action: 'logout',
            at: new Date().toISOString(),
          }
          return { entries: [entry, ...state.entries].slice(0, 200) }
        }),
    }),
    { name: 'camus_access_log_v1' },
  ),
)
