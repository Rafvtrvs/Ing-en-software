// ============================================================
//  Configuración de Express: CORS, JSON, logging, rutas y errores.
// ============================================================
import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import { env } from './config/env.js'
import { router } from './router.js'
import { errorHandler, notFound } from './middleware/error.js'

export function createApp() {
  const app = express()

  app.use(cors({ origin: env.corsOrigin, credentials: true }))
  app.use(express.json())
  app.use(morgan('dev'))

  // Todas las solicitudes HTTPS (JSON) cuelgan de /api
  app.use('/api', router)

  app.use(notFound)
  app.use(errorHandler)

  return app
}
