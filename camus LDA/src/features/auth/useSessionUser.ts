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

  return useMemo(() => {
    const authUser = authService.getUser()
    return {
      id: authUser?.id,
      name: authUser?.name ?? appUser.name,
      role: authUser?.role ?? appUser.role,
      email: authUser?.email,
    }
  }, [appUser.name, appUser.role])
}
