import type { Client } from '@/types'

export function normalizeRut(rut: string): string {
  return rut.replace(/[.\-\s]/g, '').toUpperCase()
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '')
}

export type DuplicateField = 'rut' | 'email' | 'phone'

export function findDuplicateClient(
  clients: Client[],
  input: { rut: string; email?: string; phone?: string },
  excludeId?: string,
): { field: DuplicateField; message: string } | null {
  const rutNorm = normalizeRut(input.rut)
  const emailNorm = input.email ? normalizeEmail(input.email) : ''
  const phoneNorm = input.phone ? normalizePhone(input.phone) : ''

  for (const client of clients) {
    if (excludeId && client.id === excludeId) continue

    if (rutNorm && normalizeRut(client.rut) === rutNorm) {
      return {
        field: 'rut',
        message: 'Ya existe un cliente registrado con este RUT.',
      }
    }

    const clientEmail = normalizeEmail(client.email)
    if (emailNorm && clientEmail && clientEmail === emailNorm) {
      return {
        field: 'email',
        message: 'Ya existe un cliente registrado con este correo electrónico.',
      }
    }

    const clientPhone = normalizePhone(client.phone)
    if (phoneNorm.length >= 8 && clientPhone && clientPhone === phoneNorm) {
      return {
        field: 'phone',
        message: 'Ya existe un cliente registrado con este teléfono.',
      }
    }
  }

  return null
}
