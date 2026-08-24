// ============================================================
//  Servidor HTTPS (Node.js + TypeScript)
//  Punto de entrada de la capa Controladores del diagrama.
//
//  En desarrollo se sirve por HTTP local. En producción el componente
//  equivale a un Servidor HTTPS (terminación TLS vía la plataforma de
//  despliegue / proxy), sin cambiar el código.
// ============================================================
import { createApp } from './app.js'
import { env } from './config/env.js'
import { connectDb, disconnectDb } from './db/prisma.js'

async function main() {
  await connectDb()
  const app = createApp()

  const server = app.listen(env.port, () => {
    console.log(`[server] escuchando en http://localhost:${env.port}/api`)
    console.log(`[server] auth=${env.auth.provider} storage=${env.external.storageProvider} mail=${env.external.mailProvider} push=${env.external.pushProvider}`)
  })

  const shutdown = async () => {
    console.log('\n[server] cerrando...')
    server.close()
    await disconnectDb()
    process.exit(0)
  }
  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

main().catch(async (err) => {
  console.error('[server] error fatal al iniciar', err)
  await disconnectDb()
  process.exit(1)
})
