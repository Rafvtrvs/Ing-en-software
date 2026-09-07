import { mockEquipment } from '@/data/mock/equipment'
import type { Equipment, Product, WorkOrder } from '@/types'

export type PhysicalAssetKind = 'equipment' | 'truck'

export interface PhysicalAssetOption {
  kind: PhysicalAssetKind
  id: string
  code: string
  name: string
  category: string
}

export interface AssetUsageService {
  orderId: string
  client: string
  service: string
  address: string
  status: WorkOrder['status']
  technician?: string
  createdAt: string
  linkType: 'equipmentId' | 'truckCode' | 'assignedOrderId'
}

export function getMachineryCategories(products: Product[]): string[] {
  const fromEquipment = mockEquipment.map((e) => e.category)
  const fromTrucks = products.filter((p) => p.category === 'Camiones').map(() => 'Camiones')
  return Array.from(new Set([...fromEquipment, ...fromTrucks])).sort((a, b) =>
    a.localeCompare(b),
  )
}

export function getPhysicalAssets(
  products: Product[],
  category?: string,
): PhysicalAssetOption[] {
  const equipment = mockEquipment
    .filter((e) => !category || e.category === category)
    .map((e) => ({
      kind: 'equipment' as const,
      id: e.id,
      code: e.code,
      name: e.name,
      category: e.category,
    }))

  const trucks =
    !category || category === 'Camiones'
      ? products
          .filter((p) => p.category === 'Camiones')
          .map((p) => ({
            kind: 'truck' as const,
            id: p.id,
            code: p.code,
            name: p.name,
            category: p.category,
          }))
      : []

  return [...equipment, ...trucks].sort((a, b) => a.name.localeCompare(b.name))
}

export function findOrdersForAsset(
  asset: PhysicalAssetOption,
  orders: WorkOrder[],
  equipment: Equipment[] = mockEquipment,
): AssetUsageService[] {
  const matches: AssetUsageService[] = []

  for (const order of orders) {
    if (asset.kind === 'equipment') {
      if (order.equipmentId === asset.id) {
        matches.push({
          orderId: order.id,
          client: order.client,
          service: order.service ?? order.category,
          address: order.address,
          status: order.status,
          technician: order.technician,
          createdAt: order.createdAt,
          linkType: 'equipmentId',
        })
        continue
      }
      const eq = equipment.find((e) => e.id === asset.id)
      if (eq?.assignedOrderId === order.id) {
        matches.push({
          orderId: order.id,
          client: order.client,
          service: order.service ?? order.category,
          address: order.address,
          status: order.status,
          technician: order.technician,
          createdAt: order.createdAt,
          linkType: 'assignedOrderId',
        })
      }
    } else if (order.truckCode === asset.code) {
      matches.push({
        orderId: order.id,
        client: order.client,
        service: order.service ?? order.category,
        address: order.address,
        status: order.status,
        technician: order.technician,
        createdAt: order.createdAt,
        linkType: 'truckCode',
      })
    }
  }

  const unique = new Map<string, AssetUsageService>()
  for (const row of matches) {
    unique.set(row.orderId, row)
  }
  return Array.from(unique.values()).sort((a, b) => b.orderId.localeCompare(a.orderId))
}
