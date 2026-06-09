import type { ProductCategory, Supplier } from '@/types'

export const initialCategories: ProductCategory[] = [
  {
    id: 'cat-1',
    name: 'Tuberías',
    description: 'Tuberías PVC, HDPE y accesorios de conducción.',
    status: 'Activa',
  },
  {
    id: 'cat-2',
    name: 'Accesorios',
    description: 'Codos, tees, reducciones y uniones.',
    status: 'Activa',
  },
  {
    id: 'cat-3',
    name: 'Sellos',
    description: 'Sellos hidráulicos y empaquetaduras.',
    status: 'Activa',
  },
  {
    id: 'cat-4',
    name: 'Equipos',
    description: 'Bombas, equipos de succión y herramientas.',
    status: 'Activa',
  },
  {
    id: 'cat-5',
    name: 'Mangueras',
    description: 'Mangueras flexibles y conexiones rápidas.',
    status: 'Activa',
  },
  {
    id: 'cat-6',
    name: 'Válvulas',
    description: 'Válvulas de control y retención.',
    status: 'Activa',
  },
  {
    id: 'cat-7',
    name: 'Insumos',
    description: 'Cemento, adhesivos y materiales de obra.',
    status: 'Activa',
  },
]

export const initialSuppliers: Supplier[] = [
  {
    id: 'sup-1',
    name: 'Distribuidora Sanitaria SpA',
    rut: '76.543.210-9',
    contact: 'Roberto Díaz',
    phone: '+56 2 2345 6789',
    email: 'ventas@sanitaria.cl',
    address: 'Av. Américo Vespucio 1500, Santiago',
    paymentTerms: '30 días',
    status: 'Activo',
  },
  {
    id: 'sup-2',
    name: 'PVC Industrial Ltda.',
    rut: '77.654.321-0',
    contact: 'María López',
    phone: '+56 9 8765 4321',
    email: 'compras@pvcindustrial.cl',
    address: 'Camino Lo Echevers 890, Quilicura',
    paymentTerms: '45 días',
    status: 'Activo',
  },
  {
    id: 'sup-3',
    name: 'Bombas y Equipos del Sur',
    rut: '78.765.432-1',
    contact: 'Carlos Muñoz',
    phone: '+56 2 2987 6543',
    email: 'contacto@bombassur.cl',
    address: 'Los Carrera 234, Concepción',
    paymentTerms: 'Contado / 15 días',
    status: 'Activo',
  },
  {
    id: 'sup-4',
    name: 'Ferretería Mayorista Norte',
    rut: '79.876.543-2',
    contact: 'Ana Rojas',
    phone: '+56 9 7654 3210',
    email: 'ana.rojas@ferrenorte.cl',
    address: 'Panamericana Norte Km 12, Colina',
    paymentTerms: '60 días',
    status: 'Inactivo',
  },
]
