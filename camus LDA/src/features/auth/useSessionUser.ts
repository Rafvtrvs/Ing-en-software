import { useEffect, useMemo } from 'react'
import { authService } from '@/services/authService'
import { useAppStore } from '@/store/useAppStore'
import type { OrderPermissionUser } from '@/features/orders/utils/canEditOrder'

/** Usuario de sesión (JWT) + hidrata el store al montar */
export function useSessionUser(): OrderPermissionUser {
  const appUser = useAppStore((s) => s.user)
  const setUser = useAppStore((s) => s.setUser)

  useEffect(() => {
    const authUser = authService.getUser()
    if (!authUser) return
    if (
      appUser.name !== authUser.name ||
      appUser.role !== authUser.role
    ) {
      setUser({
        name: authUser.name,
        role: authUser.role,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(authUser.name)}`,
      })
    }
  }, [appUser.name, appUser.role, setUser])

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
