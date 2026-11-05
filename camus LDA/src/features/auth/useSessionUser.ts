import { useEffect, useMemo } from 'react'
import { authService } from '@/services/authService'
import { useAppStore } from '@/store/useAppStore'
import { applySessionUser } from '@/features/auth/sessionAvatar'
import type { OrderPermissionUser } from '@/features/orders/utils/canEditOrder'

/** Usuario de sesión (JWT) + hidrata el store al montar (avatar desde BD). */
export function useSessionUser(): OrderPermissionUser {
  const appUser = useAppStore((s) => s.user)

  useEffect(() => {
    const authUser = authService.getUser()
    if (!authUser) return
    const avatar = authUser.avatar?.trim() || ''
    const needsSync =
      appUser.name !== authUser.name ||
      appUser.role !== authUser.role ||
      (appUser.avatar || '') !== avatar
    if (needsSync) {
      applySessionUser({
        name: authUser.name,
        role: authUser.role,
        email: authUser.email,
        phone: authUser.phone,
        avatar: authUser.avatar,
      })
    }
  }, [appUser.name, appUser.role, appUser.avatar])

  const authUser = authService.getUser()

  return useMemo(() => {
    const session = authService.getUser()
    return {
      id: session?.id,
      name: session?.name ?? appUser.name,
      role: session?.role ?? appUser.role,
      email: session?.email,
    }
  }, [appUser.name, appUser.role, authUser?.id, authUser?.role, authUser?.name, authUser?.email])
}
