import { readFileSync } from 'node:fs'
import { cert, getApps, initializeApp, type App, type ServiceAccount } from 'firebase-admin/app'
import { getAuth, type Auth } from 'firebase-admin/auth'
import { getMessaging, type Messaging } from 'firebase-admin/messaging'
import { env } from '../config/env.js'

let app: App | null = null

function loadServiceAccount(): ServiceAccount | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim()
  if (raw) {
    try {
      return JSON.parse(raw) as ServiceAccount
    } catch {
      console.error('[firebase-admin] FIREBASE_SERVICE_ACCOUNT_JSON inválido')
      return null
    }
  }
  const path = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim()
  if (path) {
    try {
      return JSON.parse(readFileSync(path, 'utf8')) as ServiceAccount
    } catch (err) {
      console.error('[firebase-admin] No se pudo leer GOOGLE_APPLICATION_CREDENTIALS', err)
      return null
    }
  }
  return null
}

/** Inicializa Admin SDK una sola vez (Auth verify + FCM). */
export function initFirebaseAdmin(): boolean {
  if (app) return true
  const existing = getApps()
  if (existing.length > 0) {
    app = existing[0]!
    return true
  }
  const credentials = loadServiceAccount()
  if (!credentials) {
    if (env.auth.provider === 'firebase' || env.external.pushProvider === 'fcm') {
      console.warn(
        '[firebase-admin] Sin credenciales: definí FIREBASE_SERVICE_ACCOUNT_JSON o GOOGLE_APPLICATION_CREDENTIALS',
      )
    }
    return false
  }
  app = initializeApp({
    credential: cert(credentials),
  })
  return true
}

export function getFirebaseAuth(): Auth | null {
  if (!initFirebaseAdmin() || !app) return null
  return getAuth(app)
}

export function getFirebaseMessaging(): Messaging | null {
  if (!initFirebaseAdmin() || !app) return null
  return getMessaging(app)
}
