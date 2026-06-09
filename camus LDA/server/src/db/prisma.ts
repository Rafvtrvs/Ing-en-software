// ============================================================
//  Conexión BD (Prisma ORM) -> PostgreSQL
//  Componente "Conexión BD << FireBase Admin SDK + Prisma ORM >>".
//  Cliente único reutilizado por todos los services.
// ============================================================
import { PrismaClient } from '@prisma/client'

export const prisma = new PrismaClient({
  log: ['warn', 'error'],
})

export async function connectDb(): Promise<void> {
  await prisma.$connect()
}

export async function disconnectDb(): Promise<void> {
  await prisma.$disconnect()
}
