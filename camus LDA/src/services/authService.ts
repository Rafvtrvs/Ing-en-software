// ============================================================
//  Servicio de Autenticación (frontend) -> /api/auth
//  Con Firebase: signIn + idToken. Sin Firebase: email/password local.
// ============================================================
import axios from 'axios'
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  confirmPasswordReset,
  sendEmailVerification,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  signOut,
} from 'firebase/auth'
import api from './api'
import { findDemoUser } from '@/data/mock/authUsers'
import { getFirebaseAuth, isFirebaseConfigured } from '@/lib/firebase'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: string
  phone?: string
  avatar?: string
  emailVerified?: boolean
}

const USER_KEY = 'auth_user'
const TOKEN_KEY = 'auth_token'
const DEMO_TOKEN_PREFIX = 'demo-token:'

function saveSession(token: string, user: AuthUser) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

function demoAvatarKey(userId: string) {
  return `camus_demo_avatar_${userId}`
}

function demoLogin(email: string, password: string): AuthUser {
  const user = findDemoUser(email, password)
  if (!user) {
    throw Object.assign(new Error('Credenciales inválidas'), { code: 'INVALID_CREDENTIALS' })
  }
  const storedAvatar = localStorage.getItem(demoAvatarKey(user.id)) ?? ''
  const withAvatar: AuthUser = { ...user, avatar: storedAvatar }
  saveSession(`${DEMO_TOKEN_PREFIX}${user.email}`, withAvatar)
  return withAvatar
}

async function loginViaFirebase(email: string, password: string): Promise<AuthUser> {
  const auth = getFirebaseAuth()
  if (!auth) throw new Error('Firebase no configurado')
  const cred = await signInWithEmailAndPassword(auth, email.trim(), password)
  const idToken = await cred.user.getIdToken()
  const { data } = await api.post<{ token: string; user: AuthUser }>('/auth/login', {
    idToken,
  })
  saveSession(data.token, {
    ...data.user,
    emailVerified: cred.user.emailVerified,
  })
  if (!cred.user.emailVerified) {
    try {
      await sendEmailVerification(cred.user)
    } catch {
      /* ignore */
    }
  }
  return data.user
}

async function loginViaApi(email: string, password: string): Promise<AuthUser> {
  const { data } = await api.post<{ token: string; user: AuthUser }>('/auth/login', {
    email,
    password,
  })
  saveSession(data.token, data.user)
  return data.user
}

export const authService = {
  usesFirebase() {
    return isFirebaseConfigured()
  },

  async login(email: string, password: string): Promise<AuthUser> {
    try {
      if (isFirebaseConfigured()) {
        return await loginViaFirebase(email, password)
      }
      return await loginViaApi(email, password)
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        throw Object.assign(new Error('Credenciales inválidas'), { code: 'INVALID_CREDENTIALS' })
      }
      const code = (err as { code?: string }).code
      if (
        code === 'auth/invalid-credential' ||
        code === 'auth/wrong-password' ||
        code === 'auth/user-not-found' ||
        code === 'auth/invalid-email'
      ) {
        throw Object.assign(new Error('Credenciales inválidas'), { code: 'INVALID_CREDENTIALS' })
      }
      // Backend caído o sin red → demo local solo sin Firebase
      if (!isFirebaseConfigured() && axios.isAxiosError(err) && !err.response) {
        return demoLogin(email, password)
      }
      throw err
    }
  },

  async sendPasswordReset(email: string): Promise<void> {
    const auth = getFirebaseAuth()
    if (!auth) {
      // UI mock path: no-op success
      await new Promise((r) => setTimeout(r, 400))
      return
    }
    await sendPasswordResetEmail(auth, email.trim(), {
      url: `${window.location.origin}/restablecer-contrasena`,
      handleCodeInApp: false,
    })
  },

  async confirmPasswordReset(oobCode: string, newPassword: string): Promise<void> {
    const auth = getFirebaseAuth()
    if (!auth) throw new Error('Firebase no configurado')
    await confirmPasswordReset(auth, oobCode, newPassword)
  },

  async changePassword(currentPassword: string, nextPassword: string): Promise<void> {
    const auth = getFirebaseAuth()
    const user = auth?.currentUser
    if (!auth || !user?.email) {
      throw new Error('Sesión Firebase no disponible')
    }
    const cred = EmailAuthProvider.credential(user.email, currentPassword)
    await reauthenticateWithCredential(user, cred)
    await updatePassword(user, nextPassword)
  },

  async registerPushToken(token: string, platform = 'web'): Promise<void> {
    if (authService.isDemoSession()) return
    await api.post('/auth/devices', { token, platform })
  },

  async unregisterPushToken(token: string): Promise<void> {
    if (authService.isDemoSession()) return
    try {
      await api.delete('/auth/devices', { data: { token } })
    } catch {
      /* ignore */
    }
  },

  async updateMe(payload: {
    name?: string
    phone?: string
    avatar?: string
  }): Promise<AuthUser> {
    if (authService.isDemoSession()) {
      const current = authService.getUser()
      if (!current) throw new Error('Sin sesión')
      const next: AuthUser = {
        ...current,
        ...payload,
        avatar: payload.avatar !== undefined ? payload.avatar : current.avatar,
      }
      if (payload.avatar !== undefined) {
        if (payload.avatar) localStorage.setItem(demoAvatarKey(current.id), payload.avatar)
        else localStorage.removeItem(demoAvatarKey(current.id))
      }
      const token = localStorage.getItem(TOKEN_KEY) ?? ''
      saveSession(token, next)
      return next
    }
    const { data } = await api.put<{ user: AuthUser }>('/auth/me', payload)
    saveSession(localStorage.getItem(TOKEN_KEY) ?? '', data.user)
    return data.user
  },

  async refreshMe(): Promise<AuthUser | null> {
    if (!authService.isAuthenticated() || authService.isDemoSession()) {
      return authService.getUser()
    }
    try {
      const { data } = await api.get<{ user: AuthUser }>('/auth/me')
      saveSession(localStorage.getItem(TOKEN_KEY) ?? '', data.user)
      return data.user
    } catch {
      return authService.getUser()
    }
  },

  async logout() {
    try {
      const auth = getFirebaseAuth()
      if (auth) await signOut(auth)
    } catch {
      /* ignore */
    }
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
