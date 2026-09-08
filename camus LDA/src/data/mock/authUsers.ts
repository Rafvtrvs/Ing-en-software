import type { AuthUser } from '@/services/authService'

/** Credenciales demo cuando el backend no está disponible (mismas que server/prisma/seed.ts) */
export const DEMO_AUTH_USERS: Array<{
  email: string
  password: string
  user: AuthUser
}> = [
  {
    email: 'admin@camus.cl',
    password: 'admin123',
    user: {
      id: 'u1',
      name: 'Administrador',
      email: 'admin@camus.cl',
      role: 'Administrador',
    },
  },
  {
    email: 'operador@camus.cl',
    password: 'operador123',
    user: {
      id: 'u3',
      name: 'Luis Torres',
      email: 'operador@camus.cl',
      role: 'Técnico de Campo',
    },
  },
]

export function findDemoUser(
  email: string,
  password: string,
): AuthUser | null {
  const normalized = email.trim().toLowerCase()
  const match = DEMO_AUTH_USERS.find(
    (entry) =>
      entry.email.toLowerCase() === normalized && entry.password === password,
  )
  return match?.user ?? null
}
