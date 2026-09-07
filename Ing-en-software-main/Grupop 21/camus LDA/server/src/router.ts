// ============================================================
//  Enrutador del servidor (componente "Enrutador" del diagrama,
//  ahora del lado del backend según lo definido).
//  Mapea rutas HTTPS -> Controllers.
// ============================================================
import { Router } from 'express'
import { requireAuth, optionalAuth } from './middleware/auth.js'
import { authController } from './controllers/auth.controller.js'
import { clientController } from './controllers/client.controller.js'
import { orderController } from './controllers/order.controller.js'
import { assetController } from './controllers/asset.controller.js'
import { reportController } from './controllers/report.controller.js'

export const router = Router()

// Salud del servicio
router.get('/health', (_req, res) => res.json({ status: 'ok' }))

// Auth
router.post('/auth/login', authController.login)
router.get('/auth/me', requireAuth, authController.me)

// Clientes
router.get('/clients', optionalAuth, clientController.list)
router.post('/clients', requireAuth, clientController.create)
router.put('/clients/:id', requireAuth, clientController.update)
router.delete('/clients/:id', requireAuth, clientController.remove)

// Órdenes
router.get('/orders', optionalAuth, orderController.list)
router.post('/orders', requireAuth, orderController.create)
router.put('/orders/:id', requireAuth, orderController.update)
router.delete('/orders/:id', requireAuth, orderController.remove)

// Activos / inventario
router.get('/assets', optionalAuth, assetController.list)
router.post('/assets', requireAuth, assetController.create)
router.put('/assets/:id', requireAuth, assetController.update)
router.delete('/assets/:id', requireAuth, assetController.remove)

// Reportes y auditoría
router.get('/reports/summary', optionalAuth, reportController.summary)
router.get('/reports/audit', requireAuth, reportController.audit)
