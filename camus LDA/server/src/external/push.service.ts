// ============================================================
//  Push Notifications  ->  Firebase Cloud Messaging
//  PUSH_PROVIDER=mock | fcm
//  Data-only: evita doble notificación del navegador + SW.
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
    // Solo `data`: el cliente/SW muestran UNA notificación y pueden
    // alimentar la campanita. Con `notification` el browser duplica.
    const id = await messaging.send({
      token: message.token,
      data: {
        title: message.title,
        body: message.body,
      },
      webpush: {
        fcmOptions: {
          link: process.env.CORS_ORIGIN?.split(',')[0]?.trim() || 'https://camuslda.web.app',
        },
        headers: {
          Urgency: 'high',
        },
      },
    })
    return { id }
  }
}

export const pushService: PushService =
  env.external.pushProvider === 'fcm' ? new FcmPushService() : new MockPushService()
