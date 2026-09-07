// ============================================================
//  Servicio de correo  ->  Mailgun / SendGrid (SIMULADO)
//
//  Requiere cuenta/pago. El proveedor "mock" registra el envío por
//  consola con la misma firma que usaría el real.
// ============================================================
export interface MailMessage {
  to: string
  subject: string
  body: string
}

export interface MailService {
  send(message: MailMessage): Promise<{ id: string }>
}

class MockMailService implements MailService {
  async send(message: MailMessage) {
    const id = `mock-mail-${Date.now()}`
    console.log(
      `[mail:mock] -> ${message.to} | ${message.subject} (id: ${id})`,
    )
    return { id }
  }
}

export const mailService: MailService = new MockMailService()
