import type { ProductKit } from '@/types'

export const initialKits: ProductKit[] = [
  {
    id: 'kit-1',
    name: 'Kit Desobstrucción Básico',
    description: 'Materiales estándar para desobstrucción de alcantarillado.',
    status: 'Activo',
    items: [
      { productId: '1', productName: 'Tubería PVC 110mm', quantity: 10, unit: 'm' },
      { productId: '2', productName: 'Codo PVC 90°', quantity: 4, unit: 'un' },
      { productId: '3', productName: 'Sello hidráulico', quantity: 2, unit: 'un' },
    ],
  },
  {
    id: 'kit-2',
    name: 'Kit Mantención Preventiva',
    description: 'Insumos para mantención programada de redes.',
    status: 'Activo',
    items: [
      { productId: '7', productName: 'Cemento hidráulico', quantity: 25, unit: 'kg' },
      { productId: '5', productName: 'Manguera flexible', quantity: 15, unit: 'm' },
    ],
  },
  {
    id: 'kit-3',
    name: 'Kit Emergencia Rebalse',
    description: 'Equipamiento rápido para control de rebalse.',
    status: 'Activo',
    items: [
      { productId: '4', productName: 'Bomba sumergible', quantity: 1, unit: 'un' },
      { productId: '5', productName: 'Manguera flexible', quantity: 20, unit: 'm' },
    ],
  },
]
