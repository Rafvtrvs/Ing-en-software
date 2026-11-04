import { getToken, onMessage } from 'firebase/messaging'
import { authService } from '@/services/authService'
import { firebaseVapidKey, getFirebaseMessaging, isFirebaseConfigured } from '@/lib/firebase'
import { useNotificationsStore } from '@/store/useNotificationsStore'

const TOKEN_STORAGE = 'camus_fcm_token'
const INBOX_DB = 'camus-fcm'
const INBOX_STORE = 'inbox'

let pushSetupDone = false
let bridgesBound = false

function isAdminRole(role: string): boolean {
  return role
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .includes('administrador')
}

function pushToCampanita(title: string, body: string) {
  useNotificationsStore.getState().addNotification({
    title: title || 'Camus LDA',
    message: body || '',
    type: 'system',
    link: '/',
  })
}

function openInboxDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(INBOX_DB, 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(INBOX_STORE)) {
        db.createObjectStore(INBOX_STORE, { autoIncrement: true })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error ?? new Error('indexedDB'))
  })
}

/** Vacía la cola que el SW guardó mientras la pestaña estaba minimizada. */
export async function drainFcmInboxToCampanita(): Promise<void> {
  try {
    const db = await openInboxDb()
    if (!db.objectStoreNames.contains(INBOX_STORE)) {
      db.close()
      return
    }
    const items = await new Promise<Array<{ title?: string; body?: string }>>((resolve, reject) => {
      const tx = db.transaction(INBOX_STORE, 'readonly')
      const req = tx.objectStore(INBOX_STORE).getAll()
      req.onsuccess = () => resolve((req.result as Array<{ title?: string; body?: string }>) ?? [])
      req.onerror = () => reject(req.error)
    })
    const clearTx = db.transaction(INBOX_STORE, 'readwrite')
    clearTx.objectStore(INBOX_STORE).clear()
    await new Promise<void>((resolve, reject) => {
      clearTx.oncomplete = () => resolve()
      clearTx.onerror = () => reject(clearTx.error)
    })
    db.close()
    for (const item of items) {
      pushToCampanita(item.title ?? 'Camus LDA', item.body ?? '')
    }
  } catch {
    /* ignore */
  }
}

function bindCampanitaBridges() {
  if (bridgesBound || typeof window === 'undefined') return
  bridgesBound = true

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      const data = event.data as { type?: string; title?: string; body?: string } | undefined
      if (data?.type !== 'CAMUS_FCM') return
      pushToCampanita(data.title ?? 'Camus LDA', data.body ?? '')
    })
  }

  try {
    const bc = new BroadcastChannel('camus-fcm')
    bc.addEventListener('message', (event) => {
      const data = event.data as { type?: string; title?: string; body?: string } | undefined
      if (data?.type !== 'CAMUS_FCM') return
      pushToCampanita(data.title ?? 'Camus LDA', data.body ?? '')
    })
  } catch {
    /* ignore */
  }

  const flush = () => {
    void drainFcmInboxToCampanita()
  }
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') flush()
  })
  window.addEventListener('focus', flush)
  flush()
}

/** Registra token FCM si el usuario es Administrador (idempotente). */
export async function registerAdminPushIfNeeded(role: string): Promise<void> {
  if (!isFirebaseConfigured() || !isAdminRole(role)) return
  if (!firebaseVapidKey) {
    console.warn('[FCM] Falta VITE_FIREBASE_VAPID_KEY')
    return
  }

  bindCampanitaBridges()

  if (pushSetupDone) {
    void drainFcmInboxToCampanita()
    return
  }

  try {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      await Notification.requestPermission()
    }
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
      return
    }
    const messaging = await getFirebaseMessaging()
    if (!messaging) return

    const params = new URLSearchParams({
      apiKey: String(import.meta.env.VITE_FIREBASE_API_KEY ?? ''),
      authDomain: String(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? ''),
      projectId: String(import.meta.env.VITE_FIREBASE_PROJECT_ID ?? ''),
      messagingSenderId: String(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? ''),
      appId: String(import.meta.env.VITE_FIREBASE_APP_ID ?? ''),
    })
    const registration = await navigator.serviceWorker.register(
      `/firebase-messaging-sw.js?${params.toString()}`,
    )
    await navigator.serviceWorker.ready

    const token = await getToken(messaging, {
      vapidKey: firebaseVapidKey,
      serviceWorkerRegistration: registration,
    })
    if (!token) return

    const prev = localStorage.getItem(TOKEN_STORAGE)
    if (prev && prev !== token) {
      await authService.unregisterPushToken(prev)
    }
    await authService.registerPushToken(token, 'web')
    localStorage.setItem(TOKEN_STORAGE, token)

    onMessage(messaging, (payload) => {
      const title =
        payload.notification?.title ?? payload.data?.title ?? 'Camus LDA'
      const body = payload.notification?.body ?? payload.data?.body ?? ''
      pushToCampanita(title, body)
    })

    pushSetupDone = true
    void drainFcmInboxToCampanita()
  } catch (err) {
    console.warn('[FCM] No se pudo registrar push', err)
  }
}

export async function unregisterPushOnLogout(): Promise<void> {
  const token = localStorage.getItem(TOKEN_STORAGE)
  if (token) {
    await authService.unregisterPushToken(token)
    localStorage.removeItem(TOKEN_STORAGE)
  }
  pushSetupDone = false
}
