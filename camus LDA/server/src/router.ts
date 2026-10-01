// ============================================================
//  Enrutador del servidor (componente "Enrutador" del diagrama,
//  ahora del lado del backend según lo definido).
//  Mapea rutas HTTPS -> Controllers.
// ============================================================
import { Router } from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import { requireAuth, optionalAuth, requireRole } from './middleware/auth.js'
import { delayController } from './controllers/delay.controller.js'
import { estimateController } from './controllers/estimate.controller.js'
import { evidenceController } from './controllers/evidence.controller.js'
import { authController } from './controllers/auth.controller.js'
import { clientController } from './controllers/client.controller.js'
import { orderController } from './controllers/order.controller.js'
import { interventionController } from './controllers/intervention.controller.js'
import { documentController } from './controllers/document.controller.js'
import { assetController } from './controllers/asset.controller.js'
import { reportController } from './controllers/report.controller.js'

export const router = Router()

// Salud del servicio
router.get('/health', (_req, res) => res.json({ status: 'ok' }))

// Front: vista de mapa (archivo estático)
router.get('/map/orders/:id', (_req, res) => {
  const __dirname = path.dirname(fileURLToPath(import.meta.url))
  res.sendFile(path.join(__dirname, 'order-map.html'))
})

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
// Retrasos (RF28 / CU-93–96) e historial de cambios de estado (RF29 / CU-99).
// Deben ir antes de '/orders/:id' para no ser capturadas como id.
const adminRoles = requireRole('admin', 'jefe', 'supervisor')
router.get('/orders/delays', requireAuth, adminRoles, delayController.list)
router.post('/orders/delays/notify', requireAuth, adminRoles, delayController.notify)
router.get('/orders/history', requireAuth, adminRoles, delayController.history)
router.post('/orders/:id/delay-action', requireAuth, adminRoles, delayController.manage)
router.get('/orders/:id', optionalAuth, orderController.get)
router.post('/orders', requireAuth, orderController.create)
router.put('/orders/:id', requireAuth, orderController.update)
router.delete('/orders/:id', requireAuth, orderController.remove)

// Intervenciones por OT (RF-44 / CU-149–151)
router.get(
  '/orders/:id/interventions',
  optionalAuth,
  interventionController.list,
)
router.post(
  '/orders/:id/interventions',
  requireAuth,
  interventionController.create,
)
router.put(
  '/orders/:id/interventions/:interventionId',
  requireAuth,
  interventionController.update,
)

// Evidencia visual por OT (RF09 / CU-30–34)
router.get('/orders/:id/evidence', requireAuth, evidenceController.list)
router.post(
  '/orders/:id/evidence',
  requireAuth,
  requireRole('admin', 'operador', 'tecnico'),
  evidenceController.upload,
)
router.get('/orders/:id/evidence/:evidenceId/file', requireAuth, evidenceController.file)
router.delete(
  '/orders/:id/evidence/:evidenceId',
  requireAuth,
  requireRole('admin', 'jefe', 'supervisor'),
  evidenceController.remove,
)

// Costos y estimaciones (RF16 / CU-60–61)
const costRoles = requireRole('admin', 'jefe', 'supervisor', 'operador')
const costManagers = requireRole('admin', 'jefe', 'supervisor')
router.get('/costs/rates', requireAuth, costRoles, estimateController.listRates)
router.post('/costs/rates', requireAuth, costManagers, estimateController.createRate)
router.delete('/costs/rates/:id', requireAuth, costManagers, estimateController.removeRate)
router.post('/estimates/calculate', requireAuth, costRoles, estimateController.calculate)
router.post('/estimates', requireAuth, costRoles, estimateController.create)
router.get('/estimates', requireAuth, costRoles, estimateController.list)
router.get('/estimates/:id', requireAuth, costRoles, estimateController.get)

// Documentos / contratos / reportes (RF-40..42)
router.get(
  '/orders/:orderId/documents',
  optionalAuth,
  documentController.listByOrder,
)
router.post(
  '/orders/:orderId/documents',
  requireAuth,
  documentController.create,
)
router.post(
  '/documents/:documentId/versions',
  requireAuth,
  documentController.addVersion,
)

// Activos / inventario
router.get('/assets', optionalAuth, assetController.list)
router.post('/assets', requireAuth, assetController.create)
router.put('/assets/:id', requireAuth, assetController.update)
router.delete('/assets/:id', requireAuth, assetController.remove)

// Reportes y auditoría
router.get('/reports/summary', optionalAuth, reportController.summary)
router.get('/reports/audit', requireAuth, reportController.audit)
