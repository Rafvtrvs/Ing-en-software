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
import { commentController } from './controllers/comment.controller.js'
import { assetController } from './controllers/asset.controller.js'
import { stockMovementController } from './controllers/stock-movement.controller.js'
import { kitController } from './controllers/kit.controller.js'
import { machineryController } from './controllers/machinery.controller.js'
import { modificationController } from './controllers/modification.controller.js'
import { rescheduleController } from './controllers/reschedule.controller.js'
import { reportController } from './controllers/report.controller.js'
import { userController } from './controllers/user.controller.js'
import { invoiceController } from './controllers/invoice.controller.js'

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
router.put('/auth/me', requireAuth, authController.updateMe)
router.post('/auth/devices', requireAuth, authController.registerDevice)
router.delete('/auth/devices', requireAuth, authController.unregisterDevice)

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

router.get('/orders/:id/comments', requireAuth, commentController.list)
router.post('/orders/:id/comments', requireAuth, commentController.create)

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

// Facturación (Factura + Pago en PostgreSQL)
const billingRoles = requireRole('admin', 'jefe', 'supervisor')
router.get('/invoices', requireAuth, billingRoles, invoiceController.list)
router.get('/invoices/payments', requireAuth, billingRoles, invoiceController.listPayments)
router.get('/invoices/:id', requireAuth, billingRoles, invoiceController.get)
router.post('/invoices', requireAuth, billingRoles, invoiceController.create)
router.put('/invoices/:id', requireAuth, billingRoles, invoiceController.update)
router.delete('/invoices/:id', requireAuth, billingRoles, invoiceController.remove)
router.post(
  '/invoices/:id/payments',
  requireAuth,
  billingRoles,
  invoiceController.registerPayment,
)
router.post(
  '/invoices/:id/mark-paid',
  requireAuth,
  billingRoles,
  invoiceController.markAsPaid,
)

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
router.get(
  '/orders/:orderId/documents/:documentId/file',
  requireAuth,
  documentController.file,
)

// Activos / inventario
router.get('/assets', optionalAuth, assetController.list)
router.post('/assets', requireAuth, assetController.create)
router.put('/assets/:id', requireAuth, assetController.update)
router.delete('/assets/:id', requireAuth, assetController.remove)

// Movimientos de stock (historial persistente)
router.get('/stock-movements', optionalAuth, stockMovementController.list)
router.post('/stock-movements', requireAuth, stockMovementController.create)

// Kits y paquetes de insumos
router.get('/kits', optionalAuth, kitController.list)
router.post('/kits', requireAuth, kitController.create)
router.put('/kits/:id', requireAuth, kitController.update)
router.delete('/kits/:id', requireAuth, kitController.remove)

// Maquinaria / equipos (RF67)
router.get('/machinery', optionalAuth, machineryController.list)
router.post('/machinery', requireAuth, machineryController.create)
router.post(
  '/machinery/sync-assignments',
  requireAuth,
  machineryController.syncAssignments,
)
router.put('/machinery/:id', requireAuth, machineryController.update)
router.delete('/machinery/:id', requireAuth, machineryController.remove)

// RF68 — solicitudes de modificación de OT
router.get(
  '/modification-requests',
  optionalAuth,
  modificationController.listRequests,
)
router.post(
  '/orders/:id/modification-requests',
  requireAuth,
  modificationController.createRequest,
)
router.post(
  '/modification-requests/:requestId/approve',
  requireAuth,
  modificationController.approve,
)
router.post(
  '/modification-requests/:requestId/reject',
  requireAuth,
  modificationController.reject,
)
router.get(
  '/orders/:id/modification-history',
  optionalAuth,
  modificationController.listHistory,
)
router.post(
  '/orders/:id/modification-history',
  requireAuth,
  modificationController.addHistory,
)

// RF66 CDS 229 — historial de reprogramaciones
router.get(
  '/orders/:id/reschedules',
  optionalAuth,
  rescheduleController.list,
)
router.post(
  '/orders/:id/reschedules',
  requireAuth,
  rescheduleController.create,
)

// Usuarios y roles (credenciales en PostgreSQL)
const userManagers = requireRole('admin', 'jefe', 'supervisor')
router.get('/users', requireAuth, userManagers, userController.list)
router.post('/users', requireAuth, userManagers, userController.create)
router.put('/users/:id', requireAuth, userManagers, userController.update)
router.delete('/users/:id', requireAuth, userManagers, userController.remove)
router.get('/roles', requireAuth, userManagers, userController.listRoles)

// Reportes y auditoría
router.get('/reports/summary', optionalAuth, reportController.summary)
router.get('/reports/audit', requireAuth, reportController.audit)
