// ============================================================
//  Servicio de Autenticación (frontend) -> consume /api/auth
//  Guarda el JWT en localStorage (lo usa el interceptor de api.ts).
// ============================================================
import api from './api'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: string
}

const USER_KEY = 'auth_user'

export const authService = {
  async login(email: string, password: string): Promise<AuthUser> {
    const { data } = await api.post<{ token: string; user: AuthUser }>(
      '/auth/login',
      { email, password },
    )
    localStorage.setItem('auth_token', data.token)
    localStorage.setItem(USER_KEY, JSON.stringify(data.user))
    return data.user
  },
  logout() {
    localStorage.removeItem('auth_token')
    localStorage.removeItem(USER_KEY)
  },
  isAuthenticated() {
    return Boolean(localStorage.getItem('auth_token'))
  },
  getUser(): AuthUser | null {
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw) as AuthUser
    } catch {
      return null
    }
  },
}
