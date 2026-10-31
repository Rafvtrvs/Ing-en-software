import { authService } from '@/services/authService'
import { useAppStore } from '@/store/useAppStore'
import { useSettingsStore } from '@/store/useSettingsStore'

/** Avatar de la sesión autenticada (BD) o del perfil local. */
export function getSessionProfileAvatar(): string {
  const fromAuth = authService.getUser()?.avatar?.trim()
  if (fromAuth) return fromAuth
  const fromProfile = useSettingsStore.getState().config.profile.avatar?.trim()
  if (fromProfile) return fromProfile
  return useAppStore.getState().user.avatar?.trim() || ''
}

/** Aplica usuario de sesión al header y al panel de perfil (por cuenta). */
export function applySessionUser(partial: {
  name: string
  role: string
  email?: string
  phone?: string
  /** Si se pasa (incluso vacío), reemplaza el avatar local de la sesión */
  avatar?: string
}) {
  const avatar =
    partial.avatar !== undefined
      ? partial.avatar.trim()
      : getSessionProfileAvatar()

  useAppStore.getState().setUser({
    name: partial.name,
    role: partial.role,
    avatar,
  })

  useSettingsStore.getState().updateProfile({
    name: partial.name,
    ...(partial.email !== undefined ? { email: partial.email } : null),
    ...(partial.phone !== undefined ? { phone: partial.phone } : null),
    avatar,
  })
}
