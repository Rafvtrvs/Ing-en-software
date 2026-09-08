import type { LucideIcon } from 'lucide-react'

export type OrderStatus =
  | 'Pendiente'
  | 'En Curso'
  | 'Completada'
  | 'Abonado'
  | 'Cancelada'
export type InventoryStatus = 'Ok' | 'Bajo' | 'Crítico'
export type TrendDirection = 'up' | 'down'

export interface NavItem {
  label: string
  path: string
  icon: LucideIcon
}

export interface NavSection {
  title?: string
  items: NavItem[]
}

export interface KpiData {
  title: string
  value: string
  trend: string
  trendDirection: TrendDirection
  icon: LucideIcon
  iconBg: string
  iconColor: string
}

export type OrderPriority = 'Baja' | 'Media' | 'Alta' | 'Urgente'

/** Tipos de incidente (CU-165) */
export type IncidentType =
  | 'Obstrucción'
  | 'Fuga'
  | 'Colapso'
  | 'Rotura de Tubería'
  | 'Rebalse'
  | 'Mantención'
  | 'Otros'

export interface OrderOperator {
  id: string
  name: string
}

/** Intervención de tercero en una OT (CU-188) */
export interface ThirdPartyIntervention {
  id: string
  orderId: string
  company: string
  detail: string
  photoUrls: string[]
  registeredAt: string
}

export interface WorkOrder {
  id: string
  client: string
  address: string
  service?: string
  category: string
  status: OrderStatus
  createdAt: string
  priority?: OrderPriority
  technician?: string
  /** Código de producto (Inventario) asignado como camión */
  truckCode?: string
  /** ID del equipo (módulo Equipos) asociado a la OT */
  equipmentId?: string
  progress?: number
  /** Orden visual dentro de la columna del kanban */
  sortOrder?: number
  /** Posición en la cola de atención (arrastre manual) */
  queueOrder?: number
  /** Fecha inicio trabajo (ISO o dd/mm/yyyy) — CU-152 */
  startDate?: string
  /** Fecha término trabajo — CU-153 */
  endDate?: string
  /** Duración en horas — CU-154 */
  durationHours?: number
  /** Tipo de incidente — CU-165 */
  incidentType?: IncidentType
  /** IDs de técnicos/operadores asignados (cuadrilla) — CU-160 */
  operatorIds?: string[]
  /** Snapshot de operadores para display */
  operators?: OrderOperator[]
  /** true si la prioridad fue fijada manualmente (CU-170) */
  priorityManual?: boolean
  /** URLs de evidencia fotográfica */
  photoUrls?: string[]
  /** Intervenciones de terceros — CU-188 */
  thirdParties?: ThirdPartyIntervention[]
  /** Timestamp última generación PDF resumen — CU-173 */
  pdfGeneratedAt?: string
  /** RF61 CDS 211 — motivo de cancelación */
  cancelReason?: string
  /** RF61 CDS 212 — motivo de anulación (orden duplicada) */
  annulReason?: string
  /** RF61 CDS 212 — marca orden anulada por error */
  annulled?: boolean
  /** RF62 CDS 213 — insumos utilizados en la OT */
  suppliesUsed?: OrderSupplyUsage[]
  /** RF63 CDS 216/218 — registro de aprobación formal */
  approval?: OrderApprovalRecord
  /** RF66 — fecha de ejecución programada (reprogramación) */
  executionDate?: string
}

/** RF65 CDS 224/226 — comentario en OT con trazabilidad automática */
export interface OrderComment {
  id: string
  orderId: string
  content: string
  authorId: string
  authorName: string
  createdAt: string
}

/** RF66 CDS 229 — historial de reprogramación */
export interface OrderRescheduleEvent {
  id: string
  orderId: string
  previousDate: string
  newDate: string
  changedById: string
  changedByName: string
  changedAt: string
}

/** RF68 — solicitud de modificación de OT */
export type ModificationRequestStatus = 'Pendiente' | 'Aprobada' | 'Rechazada'

export interface OrderModificationRequest {
  id: string
  orderId: string
  operatorId: string
  operatorName: string
  fieldsToModify: string
  reason: string
  status: ModificationRequestStatus
  requestedAt: string
  reviewedById?: string
  reviewedByName?: string
  reviewedAt?: string
  rejectionReason?: string
}

/** RF68 CDS 235 — historial de modificaciones de OT */
export interface OrderModificationHistoryEntry {
  id: string
  orderId: string
  field: string
  fieldLabel: string
  previousValue: string
  newValue: string
  changedById: string
  changedByName: string
  changedAt: string
}

/** RF67 CDS 232 — estado determinado de maquinaria */
export type MachineryAvailabilityStatus = 'Disponible' | 'En uso' | 'No disponible'

/** RF62 — insumo registrado en una OT */
export interface OrderSupplyUsage {
  productId: string
  productCode: string
  productName: string
  quantity: number
  registeredAt: string
}

/** RF63 CDS 218 — aprobación formal de OT finalizada */
export interface OrderApprovalRecord {
  approvedAt: string
  approvedBy: string
  approvedByName: string
}

/** Intervención registrada en una OT (RF-44 / CU-149–151) */
export interface OrderIntervention {
  id: number
  orderId: string
  detail: string
  createdAt?: string
  updatedAt?: string
}

export interface InventoryItem {
  product: string
  currentStock: number
  minStock: number
  status: InventoryStatus
}

export interface Product {
  id: string
  code: string
  name: string
  category: string
  currentStock: number
  minStock: number
  unit: string
  status: InventoryStatus
}

export type EquipmentStatus =
  | 'Operativo'
  | 'Mantenimiento'
  | 'Fuera de servicio'
  | 'Asignado'

export interface Equipment {
  id: string
  code: string
  name: string
  serialNumber: string
  location: string
  status: EquipmentStatus
  lastMaintenance: string
  nextMaintenance: string
  assignedTo?: string
  /** OT asociada cuando el equipo está asignado */
  assignedOrderId?: string
  category: string
}

export type StockMovementType = 'Entrada' | 'Salida'

export interface StockMovement {
  id: string
  date: string
  type: StockMovementType
  productId: string
  product: string
  detail: string
  quantity: number
  user: string
}

export type InventoryTab =
  | 'inventario'
  | 'equipos'
  | 'categorias'
  | 'proveedores'
  | 'kits'

export type CategoryStatus = 'Activa' | 'Inactiva'
export type SupplierStatus = 'Activo' | 'Inactivo'

export interface ProductCategory {
  id: string
  name: string
  description: string
  status: CategoryStatus
}

export interface Supplier {
  id: string
  name: string
  rut: string
  contact: string
  phone: string
  email: string
  address: string
  paymentTerms: string
  status: SupplierStatus
}

export type KitStatus = 'Activo' | 'Inactivo'

export interface KitProductLine {
  productId: string
  productName: string
  quantity: number
  unit: string
}

export interface ProductKit {
  id: string
  name: string
  description: string
  items: KitProductLine[]
  status: KitStatus
}

export type FieldOperationStatus =
  | 'En Curso'
  | 'En Ruta'
  | 'En Espera'
  | 'Completada'
  | 'Retrasada'

export interface FieldTechnician {
  id: string
  name: string
  status: FieldOperationStatus
  address: string
  orderId: string
  progress: number
  avatar?: string
}

export interface FieldAlert {
  id: string
  type: 'error' | 'warning' | 'info' | 'success'
  title: string
  description: string
  time: string
}

export interface FieldScheduleItem {
  id: string
  start: string
  end: string
  orderId: string
  service: string
  address: string
  status: FieldOperationStatus
}

export interface FieldActiveOrder {
  id: string
  client: string
  service: string
  technician: string
  status: FieldOperationStatus
  progress: number
}

export interface ChartDataPoint {
  name: string
  value: number
  color?: string
}

export interface User {
  name: string
  role: string
  avatar?: string
  notifications: number
}

export type NotificationType = 'order' | 'system' | 'inventory'

export interface AppNotification {
  id: string
  title: string
  message: string
  type: NotificationType
  read: boolean
  createdAt: string
  link?: string
  orderId?: string
}

export type SystemUserStatus = 'Activo' | 'Inactivo' | 'Bloqueado'

export type UsersTab = 'usuarios' | 'roles' | 'historial' | 'asignaciones'

export type PermissionKey =
  | 'dashboard.view'
  | 'clients.manage'
  | 'orders.manage'
  | 'inventory.manage'
  | 'operations.view'
  | 'billing.manage'
  | 'reports.view'
  | 'users.manage'

export interface Permission {
  key: PermissionKey
  label: string
  module: string
}

export interface AppRole {
  id: string
  name: string
  description: string
  permissions: PermissionKey[]
  status: 'Activo' | 'Inactivo'
  isSystem?: boolean
}

export interface SystemUser {
  id: string
  name: string
  email: string
  phone: string
  roleId: string
  status: SystemUserStatus
  lastLogin: string
  avatar?: string
  /** RF64 — fecha de creación del usuario */
  createdAt?: string
  /** RF64 CDS 221/222 — fecha de desactivación */
  deactivatedAt?: string
}

/** RF64 CDS 223 — historial de desactivación/eliminación */
export type UserLifecycleAction = 'eliminado' | 'desactivado' | 'reactivado'

export interface UserLifecycleEvent {
  id: string
  userId: string
  userName: string
  userEmail: string
  action: UserLifecycleAction
  performedBy: string
  performedByName: string
  performedAt: string
  reason?: string
}

/** RF65 CDS 226 — trazabilidad de asignación de roles */
export interface RoleAssignmentEvent {
  id: string
  userId: string
  userName: string
  userEmail: string
  previousRoleId: string | null
  previousRoleName: string | null
  newRoleId: string
  newRoleName: string
  performedBy: string
  performedByName: string
  performedAt: string
}

export type ClientStatus = 'Activo' | 'Inactivo' | 'Pendiente' | 'Bloqueado'

export interface Client {
  id: string
  name: string
  company: string
  rut: string
  phone: string
  email: string
  status: ClientStatus
  lastOrder: string
  createdAt?: string
}

export interface ClientOrder {
  id: string
  client: string
  service: string
  status: OrderStatus
  date: string
  technician: string
  technicianAvatar?: string
}

export interface ClientDeadline {
  id: string
  client: string
  reason: string
  date: string
}

export type InvoiceStatus =
  | 'Borrador'
  | 'Emitida'
  | 'Pagada'
  | 'Vencida'
  | 'Anulada'

export type PaymentMethod = 'Transferencia' | 'Efectivo' | 'Cheque' | 'Tarjeta'

export interface Invoice {
  id: string
  number: string
  client: string
  clientRut: string
  orderId?: string
  issueDate: string
  dueDate: string
  amount: number
  status: InvoiceStatus
  paymentMethod?: PaymentMethod
  paidAt?: string
  paidAmount?: number
  notes?: string
}

export interface PaymentRecord {
  id: string
  invoiceNumber: string
  client: string
  amount: number
  method: PaymentMethod
  date: string
}

export type ReportTab =
  | 'resumen'
  | 'ordenes'
  | 'inventario'
  | 'facturacion'
  | 'trazabilidad'
  | 'activos'
  | 'costos'
  | 'tecnicos'
  | 'auditoria'

export type ReportPeriod = 'month' | 'quarter' | 'year'

export interface TechnicianPerformance {
  id: string
  name: string
  completedOrders: number
  inProgress: number
  avgCompletionDays: number
  rating: number
}

export interface ReportExportItem {
  id: string
  title: string
  description: string
  category: ReportTab
  format: 'PDF' | 'CSV'
}

export type ParametersTab =
  | 'general'
  | 'ordenes'
  | 'facturacion'
  | 'inventario'
  | 'notificaciones'
  | 'operaciones'

export interface GeneralParameters {
  companyName: string
  rut: string
  address: string
  phone: string
  email: string
  businessHoursStart: string
  businessHoursEnd: string
  timezone: string
}

export interface OrderParameters {
  orderPrefix: string
  defaultPriority: 'Baja' | 'Media' | 'Alta' | 'Urgente'
  slaHoursHigh: number
  slaHoursMedium: number
  slaHoursLow: number
  autoAssignTechnician: boolean
  requireClientSignature: boolean
  categories: string[]
}

export interface BillingParameters {
  invoicePrefix: string
  defaultDueDays: number
  taxRate: number
  defaultPaymentTerms: string
  sendReminderDaysBefore: number
  autoGenerateFromCompletedOrders: boolean
}

export interface InventoryParameters {
  lowStockPercent: number
  criticalStockPercent: number
  enableLowStockAlerts: boolean
  enableCriticalAlerts: boolean
  defaultUnit: string
}

export interface NotificationParameters {
  emailNewOrder: boolean
  emailOrderCompleted: boolean
  emailLowStock: boolean
  emailInvoiceDue: boolean
  emailDailySummary: boolean
  pushFieldUpdates: boolean
}

export interface OperationParameters {
  gpsUpdateIntervalMinutes: number
  maxOrdersPerTechnician: number
  allowOfflineMode: boolean
  requirePhotoOnComplete: boolean
  geofenceRadiusMeters: number
}

export interface SystemParameters {
  general: GeneralParameters
  orders: OrderParameters
  billing: BillingParameters
  inventory: InventoryParameters
  notifications: NotificationParameters
  operations: OperationParameters
}

export type SettingsTab = 'perfil' | 'apariencia' | 'seguridad' | 'sistema'

export type SupportTab = 'ayuda' | 'tickets' | 'contacto'

export type AppTheme = 'light' | 'dark' | 'system'

export interface UserProfileSettings {
  name: string
  email: string
  phone: string
  avatar?: string
}

export interface AppAppearanceSettings {
  theme: AppTheme
  compactSidebar: boolean
  language: 'es' | 'en'
  dateFormat: 'dd/mm/yyyy' | 'mm/dd/yyyy'
}

export interface SecuritySettings {
  twoFactorEnabled: boolean
  sessionTimeoutMinutes: number
  loginAlerts: boolean
}

export interface PlatformSystemSettings {
  maintenanceMode: boolean
  debugMode: boolean
  lastBackup: string
}

export interface AppConfiguration {
  profile: UserProfileSettings
  appearance: AppAppearanceSettings
  security: SecuritySettings
  system: PlatformSystemSettings
}

export type SupportTicketStatus = 'Abierto' | 'En Proceso' | 'Resuelto' | 'Cerrado'
export type SupportTicketPriority = 'Baja' | 'Media' | 'Alta'

export interface FaqItem {
  id: string
  category: string
  question: string
  answer: string
}

export interface SupportTicket {
  id: string
  subject: string
  description: string
  status: SupportTicketStatus
  priority: SupportTicketPriority
  createdAt: string
  updatedAt: string
}
