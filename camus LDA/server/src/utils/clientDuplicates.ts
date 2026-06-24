interface ClientLike {
  rut?: string | null
  email?: string | null
  telefono?: string | null
  phone?: string | null
}

export function normalizeRut(rut: string): string {
  return rut.replace(/[.\-\s]/g, '').toUpperCase()
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '')
}

export class ClientDuplicateError extends Error {
  status = 409
  field: 'rut' | 'email' | 'phone'

  constructor(field: 'rut' | 'email' | 'phone', message: string) {
    super(message)
    this.name = 'ClientDuplicateError'
    this.field = field
  }
}

export function assertNoDuplicateClient(
  existing: ClientLike[],
  input: { rut: string; email?: string; phone?: string },
  excludeId?: number,
) {
  const rutNorm = normalizeRut(input.rut)
  const emailNorm = input.email ? normalizeEmail(input.email) : ''
  const phoneNorm = input.phone ? normalizePhone(input.phone) : ''

  for (const row of existing) {
    const rowId = (row as { id?: number }).id
    if (excludeId !== undefined && rowId === excludeId) continue

    if (rutNorm && normalizeRut(row.rut ?? '') === rutNorm) {
      throw new ClientDuplicateError(
        'rut',
        'Ya existe un cliente registrado con este RUT.',
      )
    }

    const rowEmail = normalizeEmail(row.email ?? '')
    if (emailNorm && rowEmail && rowEmail === emailNorm) {
      throw new ClientDuplicateError(
        'email',
        'Ya existe un cliente registrado con este correo electrónico.',
      )
    }

    const rowPhone = normalizePhone(row.telefono ?? row.phone ?? '')
    if (phoneNorm.length >= 8 && rowPhone && rowPhone === phoneNorm) {
      throw new ClientDuplicateError(
        'phone',
        'Ya existe un cliente registrado con este teléfono.',
      )
    }
  }
}
