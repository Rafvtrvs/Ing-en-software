// ============================================================
//  Servicio de correo  ->  Resend | mock
//  MAIL_PROVIDER=mock | resend
// ============================================================
import { Resend } from 'resend'
import { env } from '../config/env.js'

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

class ResendMailService implements MailService {
  private client: Resend

  constructor(apiKey: string) {
    this.client = new Resend(apiKey)
  }

  async send(message: MailMessage) {
    const from = env.external.mailFrom
    const { data, error } = await this.client.emails.send({
      from,
      to: message.to,
      subject: message.subject,
      text: message.body,
    })
    if (error) {
      throw new Error(error.message || 'Error al enviar correo con Resend')
    }
    const id = data?.id ?? `resend-${Date.now()}`
    console.log(`[mail:resend] -> ${message.to} | ${message.subject} (id: ${id})`)
    return { id }
  }
}

function createMailService(): MailService {
  const provider = (env.external.mailProvider || 'mock').toLowerCase()
  if (provider === 'resend') {
    const key = env.external.resendApiKey
    if (!key) {
      console.warn('[mail] MAIL_PROVIDER=resend pero falta RESEND_API_KEY; usando mock')
      return new MockMailService()
    }
    return new ResendMailService(key)
  }
  return new MockMailService()
}

export const mailService: MailService = createMailService()

/** Destino operativo (nueva OT, retrasos). */
export function mailOpsRecipient(): string {
  return env.external.mailOpsTo
}
