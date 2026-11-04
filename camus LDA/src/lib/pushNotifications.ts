import { getToken, onMessage } from 'firebase/messaging'
import { authService } from '@/services/authService'
import { firebaseVapidKey, getFirebaseMessaging, isFirebaseConfigured } from '@/lib/firebase'
import { useNotificationsStore } from '@/store/useNotificationsStore'
import { ROUTES } from '@/constants/routes'
import type { NotificationType } from '@/types'

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

type FcmCampanitaItem = {
  title: string
  body: string
  link?: string
  orderId?: string
  notifType?: string
}

function resolveLink(item: FcmCampanitaItem): string {
  if (item.link && item.link !== '/') return item.link
  if (item.orderId) return `${ROUTES.ORDENES}?order=${encodeURIComponent(item.orderId)}`
  const blob = `${item.title} ${item.body}`.toLowerCase()
  if (blob.includes('inicio de sesión') || blob.includes('inicio de sesion')) {
    return ROUTES.USUARIOS
  }
  if (blob.includes('ot ') || blob.includes('orden') || blob.includes('estado')) {
    const match = `${item.title} ${item.body}`.match(/OT-[\w-]+/i)
    if (match) return `${ROUTES.ORDENES}?order=${encodeURIComponent(match[0])}`
    return ROUTES.ORDENES
  }
  if (blob.includes('inventario') || blob.includes('producto') || blob.includes('maquinaria')) {
    return ROUTES.INVENTARIO
  }
  return ROUTES.DASHBOARD
}

function resolveType(item: FcmCampanitaItem): NotificationType {
  if (item.notifType === 'order' || item.notifType === 'inventory' || item.notifType === 'system') {
    return item.notifType
  }
  const link = resolveLink(item)
  if (link.startsWith(ROUTES.ORDENES)) return 'order'
  if (link.startsWith(ROUTES.INVENTARIO)) return 'inventory'
  return 'system'
}

function pushToCampanita(item: FcmCampanitaItem) {
  const link = resolveLink(item)
  const orderId =
    item.orderId ||
    (link.includes('order=') ? decodeURIComponent(link.split('order=')[1] ?? '') : undefined)
  useNotificationsStore.getState().addNotification({
    title: item.title || 'Camus LDA',
    message: item.body || '',
    type: resolveType(item),
    link,
    ...(orderId ? { orderId } : null),
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

export async function drainFcmInboxToCampanita(): Promise<void> {
  try {
    const db = await openInboxDb()
    if (!db.objectStoreNames.contains(INBOX_STORE)) {
      db.close()
      return
    }
    const items = await new Promise<FcmCampanitaItem[]>((resolve, reject) => {
      const tx = db.transaction(INBOX_STORE, 'readonly')
      const req = tx.objectStore(INBOX_STORE).getAll()
      req.onsuccess = () => resolve((req.result as FcmCampanitaItem[]) ?? [])
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
      pushToCampanita({
        title: item.title ?? 'Camus LDA',
        body: item.body ?? '',
        link: item.link,
        orderId: item.orderId,
        notifType: item.notifType,
      })
    }
  } catch {
    /* ignore */
  }
}

function bindCampanitaBridges() {
  if (bridgesBound || typeof window === 'undefined') return
  bridgesBound = true

  const onFcmMessage = (data: FcmCampanitaItem & { type?: string }) => {
    if (data.type === 'CAMUS_FCM_NAV' && data.link) {
      window.location.assign(data.link.startsWith('http') ? data.link : data.link)
      return
    }
    if (data.type && data.type !== 'CAMUS_FCM') return
    pushToCampanita({
      title: data.title ?? 'Camus LDA',
      body: data.body ?? '',
      link: data.link,
      orderId: data.orderId,
      notifType: data.notifType,
    })
  }

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      onFcmMessage((event.data ?? {}) as FcmCampanitaItem & { type?: string })
    })
  }

  try {
    const bc = new BroadcastChannel('camus-fcm')
    bc.addEventListener('message', (event) => {
      onFcmMessage((event.data ?? {}) as FcmCampanitaItem & { type?: string })
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
      pushToCampanita({
        title: payload.notification?.title ?? payload.data?.title ?? 'Camus LDA',
        body: payload.notification?.body ?? payload.data?.body ?? '',
        link: payload.data?.link,
        orderId: payload.data?.orderId,
        notifType: payload.data?.notifType,
      })
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
