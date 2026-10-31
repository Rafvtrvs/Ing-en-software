import { useAppStore } from '@/store/useAppStore'
import { useSettingsStore } from '@/store/useSettingsStore'

/** Avatar del perfil guardado (foto PNG), sin pisarlo al sincronizar sesión. */
export function getSessionProfileAvatar(): string {
  const fromProfile = useSettingsStore.getState().config.profile.avatar?.trim()
  if (fromProfile) return fromProfile
  return useAppStore.getState().user.avatar?.trim() || ''
}

export function applySessionUser(partial: {
  name: string
  role: string
  avatar?: string
}) {
  useAppStore.getState().setUser({
    name: partial.name,
    role: partial.role,
    avatar:
      partial.avatar?.trim() ||
      getSessionProfileAvatar(),
  })
}
