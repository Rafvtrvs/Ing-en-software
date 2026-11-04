// ============================================================
//  Push Notifications  ->  Firebase Cloud Messaging
//  PUSH_PROVIDER=mock | fcm
// ============================================================
import { env } from '../config/env.js'
import { getFirebaseMessaging } from './firebaseAdmin.js'

export interface PushMessage {
  token: string
  title: string
  body: string
}

export interface PushService {
  notify(message: PushMessage): Promise<{ id: string }>
}

class MockPushService implements PushService {
  async notify(message: PushMessage) {
    const id = `mock-push-${Date.now()}`
    console.log(`[push:mock] -> ${message.title} | ${message.body} (id: ${id})`)
    return { id }
  }
}

class FcmPushService implements PushService {
  async notify(message: PushMessage) {
    const messaging = getFirebaseMessaging()
    if (!messaging) {
      console.warn('[push:fcm] Admin no inicializado; fallback mock')
      return new MockPushService().notify(message)
    }
    const title = String(message.title ?? 'Camus LDA')
    const body = String(message.body ?? '')
    // `notification` = texto visible en el sistema (detallado).
    // `data` = mismo contenido para campanita / SW.
    // El SW NO vuelve a llamar showNotification si ya viene `notification`.
    const id = await messaging.send({
      token: message.token,
      notification: { title, body },
      data: { title, body },
      webpush: {
        fcmOptions: {
          link: process.env.CORS_ORIGIN?.split(',')[0]?.trim() || 'https://camuslda.web.app',
        },
        headers: { Urgency: 'high' },
      },
    })
    return { id }
  }
}

export const pushService: PushService =
  env.external.pushProvider === 'fcm' ? new FcmPushService() : new MockPushService()
