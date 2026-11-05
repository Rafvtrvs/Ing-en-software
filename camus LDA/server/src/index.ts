// ============================================================
//  Servidor HTTPS (Node.js + TypeScript)
//  Punto de entrada de la capa Controladores del diagrama.
//
//  En desarrollo se sirve por HTTP local. En producción el componente
//  equivale a un Servidor HTTPS (terminación TLS vía la plataforma de
//  despliegue / proxy), sin cambiar el código.
// ============================================================
import type { Server } from 'node:http'
import { createApp } from './app.js'
import { env } from './config/env.js'
import { connectDb, disconnectDb } from './db/prisma.js'
import { delayService } from './services/delay.service.js'
import { machineryService } from './services/machinery.service.js'

const LISTEN_RETRIES = 30
const LISTEN_RETRY_MS = 500

function listen(app: ReturnType<typeof createApp>, port: number): Promise<Server> {
  return new Promise((resolve, reject) => {
    const attempt = (n: number) => {
      const server = app.listen(port)

      const onListening = () => {
        server.off('error', onError)
        resolve(server)
      }

      const onError = (err: NodeJS.ErrnoException) => {
        server.off('listening', onListening)
        if (err.code === 'EADDRINUSE' && n < LISTEN_RETRIES) {
          console.warn(
            `[server] puerto ${port} ocupado; reintento ${n + 1}/${LISTEN_RETRIES} en ${LISTEN_RETRY_MS}ms...`,
          )
          server.close(() => {
            setTimeout(() => attempt(n + 1), LISTEN_RETRY_MS)
          })
          return
        }
        reject(err)
      }

      server.once('listening', onListening)
      server.once('error', onError)
    }

    attempt(0)
  })
}

async function main() {
  await connectDb()
  const app = createApp()

  const server = await listen(app, env.port)
  console.log(`[server] escuchando en http://localhost:${env.port}/api`)
  console.log(
    `[server] auth=${env.auth.provider} storage=${env.external.storageProvider} mail=${env.external.mailProvider} push=${env.external.pushProvider}`,
  )

  // RF28 CU-95: revisión automática de retrasos (cada hora; el servicio evita repetir alertas)
  const delayTimer = setInterval(() => {
    delayService.notifyHighDelays().catch((err) => console.error('[delay] revisión fallida', err))
  }, 60 * 60 * 1000)
  delayTimer.unref()

  // Mantenciones vencidas o próximas (cada hora; deduplica en bitácora)
  const maintTimer = setInterval(() => {
    machineryService
      .notifyDueMaintenance()
      .catch((err) => console.error('[machinery] revisión mantención fallida', err))
  }, 60 * 60 * 1000)
  maintTimer.unref()
  // Primera pasada al arrancar (no esperar una hora)
  machineryService
    .notifyDueMaintenance()
    .catch((err) => console.error('[machinery] revisión mantención inicial fallida', err))

  let shuttingDown = false
  const shutdown = () => {
    if (shuttingDown) return
    shuttingDown = true
    clearInterval(delayTimer)
    clearInterval(maintTimer)
    console.log('\n[server] cerrando...')
    server.close((closeErr) => {
      if (closeErr) console.error('[server] error al cerrar HTTP', closeErr)
      void disconnectDb()
        .catch((err) => console.error('[server] error al cerrar DB', err))
        .finally(() => process.exit(closeErr ? 1 : 0))
    })
    // Si close se cuelga (conexiones keep-alive), forzar salida
    setTimeout(() => process.exit(0), 2500).unref()
  }
  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

main().catch(async (err) => {
  console.error('[server] error fatal al iniciar', err)
  await disconnectDb().catch(() => undefined)
  process.exit(1)
})
