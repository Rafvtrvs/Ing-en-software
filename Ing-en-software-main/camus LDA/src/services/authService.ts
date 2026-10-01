// ============================================================
//  Servicio de Autenticación (frontend) -> consume /api/auth
//  Si el backend no responde, usa credenciales demo (mock).
// ============================================================
import axios from 'axios'
import api from './api'
import { findDemoUser } from '@/data/mock/authUsers'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: string
}

const USER_KEY = 'auth_user'
const TOKEN_KEY = 'auth_token'
const DEMO_TOKEN_PREFIX = 'demo-token:'

function saveSession(token: string, user: AuthUser) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

function demoLogin(email: string, password: string): AuthUser {
  const user = findDemoUser(email, password)
  if (!user) {
    throw Object.assign(new Error('Credenciales inválidas'), { code: 'INVALID_CREDENTIALS' })
  }
  saveSession(`${DEMO_TOKEN_PREFIX}${user.email}`, user)
  return user
}

export const authService = {
  async login(email: string, password: string): Promise<AuthUser> {
    try {
      const { data } = await api.post<{ token: string; user: AuthUser }>(
        '/auth/login',
        { email, password },
      )
      saveSession(data.token, data.user)
      return data.user
    } catch (err) {
      // Credenciales incorrectas contra API activa → no usar fallback demo
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        throw Object.assign(new Error('Credenciales inválidas'), { code: 'INVALID_CREDENTIALS' })
      }

      // Backend caído o sin red → modo demo local
      return demoLogin(email, password)
    }
  },

  logout() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  },

  isAuthenticated() {
    return Boolean(localStorage.getItem(TOKEN_KEY))
  },

  isDemoSession() {
    const token = localStorage.getItem(TOKEN_KEY)
    return Boolean(token?.startsWith(DEMO_TOKEN_PREFIX))
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
