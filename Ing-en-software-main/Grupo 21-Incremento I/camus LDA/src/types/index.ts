import type { LucideIcon } from 'lucide-react'

export type OrderStatus = 'Pendiente' | 'En Curso' | 'Completada' | 'Cancelada'
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

export interface WorkOrder {
  id: string
  client: string
  address: string
  service?: string
  category: string
  status: OrderStatus
  createdAt: string
  priority?: 'Baja' | 'Media' | 'Alta'
  technician?: string
  progress?: number
  /** Orden visual dentro de la columna del kanban */
  sortOrder?: number
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

export type InventoryTab = 'inventario' | 'categorias' | 'proveedores' | 'kits'

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

export type SystemUserStatus = 'Activo' | 'Inactivo' | 'Bloqueado'

export type UsersTab = 'usuarios' | 'roles'

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

export type ReportTab = 'resumen' | 'ordenes' | 'inventario' | 'facturacion' | 'tecnicos'

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
  format: 'CSV' | 'PDF'
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
  defaultPriority: 'Baja' | 'Media' | 'Alta'
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
