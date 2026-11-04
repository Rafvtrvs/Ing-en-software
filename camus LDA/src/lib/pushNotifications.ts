import { getToken, onMessage } from 'firebase/messaging'
import { authService } from '@/services/authService'
import { firebaseVapidKey, getFirebaseMessaging, isFirebaseConfigured } from '@/lib/firebase'
import { useNotificationsStore } from '@/store/useNotificationsStore'

const TOKEN_STORAGE = 'camus_fcm_token'

let pushSetupDone = false
let swMessageBound = false

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

function bindServiceWorkerCampanitaBridge() {
  if (swMessageBound || typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return
  }
  swMessageBound = true
  navigator.serviceWorker.addEventListener('message', (event) => {
    const data = event.data as { type?: string; title?: string; body?: string } | undefined
    if (data?.type !== 'CAMUS_FCM') return
    pushToCampanita(data.title ?? 'Camus LDA', data.body ?? '')
  })
}

/** Registra token FCM si el usuario es Administrador (idempotente). */
export async function registerAdminPushIfNeeded(role: string): Promise<void> {
  if (!isFirebaseConfigured() || !isAdminRole(role)) return
  if (!firebaseVapidKey) {
    console.warn('[FCM] Falta VITE_FIREBASE_VAPID_KEY')
    return
  }

  bindServiceWorkerCampanitaBridge()

  if (pushSetupDone) return

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

    // Un solo listener foreground → campanita (sin Notification nativa extra)
    onMessage(messaging, (payload) => {
      const title =
        payload.data?.title ?? payload.notification?.title ?? 'Camus LDA'
      const body = payload.data?.body ?? payload.notification?.body ?? ''
      pushToCampanita(title, body)
    })

    pushSetupDone = true
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
