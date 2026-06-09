import type { AppConfiguration, FaqItem, SupportTicket } from '@/types'

export const defaultAppConfiguration: AppConfiguration = {
  profile: {
    name: 'Juan Pérez',
    email: 'juan.perez@camus.cl',
    phone: '+56 9 8765 4321',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Juan',
  },
  appearance: {
    theme: 'light',
    compactSidebar: false,
    language: 'es',
    dateFormat: 'dd/mm/yyyy',
  },
  security: {
    twoFactorEnabled: false,
    sessionTimeoutMinutes: 60,
    loginAlerts: true,
  },
  system: {
    maintenanceMode: false,
    debugMode: false,
    lastBackup: '2026-05-24T22:00:00',
  },
}

export const APP_VERSION = '1.0.0'

export const faqItems: FaqItem[] = [
  {
    id: 'faq-1',
    category: 'Órdenes',
    question: '¿Cómo creo una nueva orden de trabajo?',
    answer:
      'Ve a Órdenes de Trabajo y pulsa "Nueva Orden". Completa cliente, dirección, categoría y prioridad. También puedes crearla desde el Dashboard con acciones rápidas.',
  },
  {
    id: 'faq-2',
    category: 'Órdenes',
    question: '¿Puedo reordenar órdenes en el tablero Kanban?',
    answer:
      'Sí. Arrastra las tarjetas dentro de la misma columna para cambiar el orden de prioridad visual. El estado se actualiza al mover entre columnas.',
  },
  {
    id: 'faq-3',
    category: 'Inventario',
    question: '¿Cuándo se genera una alerta de stock?',
    answer:
      'Según los umbrales definidos en Parámetros → Inventario. El sistema marca productos en estado Bajo o Crítico automáticamente.',
  },
  {
    id: 'faq-4',
    category: 'Facturación',
    question: '¿Cómo marco una factura como pagada?',
    answer:
      'En Facturación, usa el ícono de check verde en la tabla o abre el detalle y pulsa "Marcar como Pagada".',
  },
  {
    id: 'faq-5',
    category: 'Reportes',
    question: '¿Puedo exportar reportes a Excel?',
    answer:
      'Los reportes se exportan en CSV compatible con Excel desde cada pestaña o con "Exportar todo" en la cabecera.',
  },
  {
    id: 'faq-6',
    category: 'Usuarios',
    question: '¿Cómo asigno permisos a un rol?',
    answer:
      'En Usuarios y Roles → Roles y Permisos, edita el rol y marca los módulos permitidos. Los usuarios heredan los permisos de su rol.',
  },
]

export const initialSupportTickets: SupportTicket[] = [
  {
    id: 'TK-2026-0042',
    subject: 'Error al exportar inventario',
    description: 'El CSV descarga vacío cuando hay filtros activos.',
    status: 'En Proceso',
    priority: 'Media',
    createdAt: '2026-05-23',
    updatedAt: '2026-05-24',
  },
  {
    id: 'TK-2026-0041',
    subject: 'Solicitud capacitación app móvil',
    description: 'Equipo de técnicos necesita capacitación en terreno.',
    status: 'Abierto',
    priority: 'Baja',
    createdAt: '2026-05-22',
    updatedAt: '2026-05-22',
  },
  {
    id: 'TK-2026-0038',
    subject: 'Integración con facturación SII',
    description: 'Consulta por timbraje electrónico.',
    status: 'Resuelto',
    priority: 'Alta',
    createdAt: '2026-05-15',
    updatedAt: '2026-05-20',
  },
]
