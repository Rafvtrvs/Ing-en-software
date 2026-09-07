// ============================================================
//  Push Notifications  ->  Firebase Cloud Messaging (SIMULADO)
//
//  Proveedor "mock" que simula el envío de notificaciones push.
// ============================================================
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
    console.log(`[push:mock] -> ${message.title} (id: ${id})`)
    return { id }
  }
}

export const pushService: PushService = new MockPushService()
