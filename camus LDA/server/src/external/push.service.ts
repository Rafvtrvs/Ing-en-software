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
  /** Ruta de la app, p. ej. /ordenes?order=OT-1 */
  link?: string
  orderId?: string
  notifType?: 'order' | 'system' | 'inventory'
}

export interface PushService {
  notify(message: PushMessage): Promise<{ id: string }>
}

class MockPushService implements PushService {
  async notify(message: PushMessage) {
    const id = `mock-push-${Date.now()}`
    console.log(
      `[push:mock] -> ${message.title} | ${message.body} | link=${message.link ?? '-'} (id: ${id})`,
    )
    return { id }
  }
}

class FcmPushService implements PushService {
  async notify(message: PushMessage) {
    const token = String(message.token ?? '').trim()
    // Tokens placeholder / inválidos: no llamar a FCM
    if (!token || token.length < 20 || token === 'field-team') {
      console.warn(`[push:fcm] token inválido omitido: "${token.slice(0, 24)}"`)
      return { id: `skip-invalid-${Date.now()}` }
    }

    const messaging = getFirebaseMessaging()
    if (!messaging) {
      console.warn('[push:fcm] Admin no inicializado; fallback mock')
      return new MockPushService().notify(message)
    }
    const title = String(message.title ?? 'Camus LDA')
    const body = String(message.body ?? '')
    const link = String(message.link ?? '/')
    const data: Record<string, string> = {
      title,
      body,
      link,
      notifType: message.notifType ?? 'system',
    }
    if (message.orderId) data.orderId = String(message.orderId)

    try {
      const id = await messaging.send({
        token,
        notification: { title, body },
        data,
        webpush: {
          fcmOptions: {
            link:
              (process.env.CORS_ORIGIN?.split(',')[0]?.trim() || 'https://camuslda.web.app') +
              (link.startsWith('/') ? link : `/${link}`),
          },
          headers: { Urgency: 'high' },
        },
      })
      return { id }
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? ''
      const msg = err instanceof Error ? err.message : String(err)
      // Token caducado / inválido: no propagar (no tumbar create/update de OT)
      if (
        code.includes('invalid-argument') ||
        code.includes('registration-token-not-registered') ||
        msg.includes('not a valid FCM registration token')
      ) {
        console.warn(`[push:fcm] token rechazado, se omite: ${msg}`)
        try {
          const { prisma } = await import('../db/prisma.js')
          await prisma.dispositivoPush.deleteMany({ where: { fcmToken: token } })
        } catch {
          /* ignore cleanup */
        }
        return { id: `skip-rejected-${Date.now()}` }
      }
      console.error('[push:fcm] error', err)
      return { id: `skip-error-${Date.now()}` }
    }
  }
}

export const pushService: PushService =
  env.external.pushProvider === 'fcm' ? new FcmPushService() : new MockPushService()
