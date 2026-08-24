import { useEffect } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { KpiCard } from '@/components/ui/KpiCard'
import { Tabs } from '@/components/ui/Tabs'
import { ToastContainerView } from '@/components/ui/ToastContainer'
import { useInventoryStore } from '@/store/useInventoryStore'
import { getInventoryKpis } from '@/data/mock/inventory'
import type { InventoryTab } from '@/types'
import { InventoryTable } from './components/InventoryTable'
import { RecentMovementsTable } from './components/RecentMovementsTable'
import { InventorySummaryChart } from './components/InventorySummaryChart'
import { MostUsedProductsChart } from './components/MostUsedProductsChart'
import { InventoryAlerts } from './components/InventoryAlerts'
import { CategoriesPanel } from './components/CategoriesPanel'
import { SuppliersPanel } from './components/SuppliersPanel'
import { KitsPanel } from './components/KitsPanel'
import { ProductFormModal } from './components/ProductFormModal'
import { ProductViewModal } from './components/ProductViewModal'
import { DeleteProductModal } from './components/DeleteProductModal'
import { CategoryFormModal } from './components/CategoryFormModal'
import { CategoryViewModal } from './components/CategoryViewModal'
import { DeleteCategoryModal } from './components/DeleteCategoryModal'
import { SupplierFormModal } from './components/SupplierFormModal'
import { SupplierViewModal } from './components/SupplierViewModal'
import { DeleteSupplierModal } from './components/DeleteSupplierModal'
import { KitFormModal } from './components/KitFormModal'
import { KitViewModal } from './components/KitViewModal'
import { DeleteKitModal } from './components/DeleteKitModal'

const INVENTORY_TABS: { id: InventoryTab; label: string }[] = [
  { id: 'inventario', label: 'Inventario' },
  { id: 'categorias', label: 'Categorías' },
  { id: 'proveedores', label: 'Proveedores' },
  { id: 'kits', label: 'Kits y Paquetes' },
]

export function InventoryPage() {
  const products = useInventoryStore((s) => s.products)
  const activeTab = useInventoryStore((s) => s.activeTab)
  const setActiveTab = useInventoryStore((s) => s.setActiveTab)
  const modalEntity = useInventoryStore((s) => s.modalEntity)
  const modalMode = useInventoryStore((s) => s.modalMode)
  const selectedProduct = useInventoryStore((s) => s.selectedProduct)
  const selectedCategory = useInventoryStore((s) => s.selectedCategory)
  const selectedSupplier = useInventoryStore((s) => s.selectedSupplier)
  const selectedKit = useInventoryStore((s) => s.selectedKit)
  const closeModal = useInventoryStore((s) => s.closeModal)
  const toasts = useInventoryStore((s) => s.toasts)
  const removeToast = useInventoryStore((s) => s.removeToast)
  const syncProductsFromApi = useInventoryStore((s) => s.syncProductsFromApi)

  useEffect(() => {
    void syncProductsFromApi()
  }, [syncProductsFromApi])

  const kpis = getInventoryKpis(products)

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="Recursos e Inventario"
          subtitle="Gestiona y controla los recursos, repuestos e insumos de la empresa."
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {kpis.map((kpi) => (
            <KpiCard key={kpi.title} data={kpi} />
          ))}
        </div>

        <Tabs tabs={INVENTORY_TABS} active={activeTab} onChange={setActiveTab} />

        {activeTab === 'inventario' && (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <InventoryTable />
              <RecentMovementsTable />
            </div>
            <div className="space-y-6">
              <InventorySummaryChart />
              <MostUsedProductsChart />
              <InventoryAlerts />
            </div>
          </div>
        )}

        {activeTab === 'categorias' && <CategoriesPanel />}
        {activeTab === 'proveedores' && <SuppliersPanel />}

        {activeTab === 'kits' && <KitsPanel />}
      </div>

      {modalEntity === 'product' && (
        <>
          <ProductFormModal
            mode="create"
            open={modalMode === 'create'}
            onClose={closeModal}
          />
          <ProductFormModal
            mode="edit"
            product={selectedProduct}
            open={modalMode === 'edit'}
            onClose={closeModal}
          />
          <ProductViewModal
            product={selectedProduct}
            open={modalMode === 'view'}
            onClose={closeModal}
          />
          <DeleteProductModal
            product={selectedProduct}
            open={modalMode === 'delete'}
            onClose={closeModal}
          />
        </>
      )}

      {modalEntity === 'category' && (
        <>
          <CategoryFormModal
            mode="create"
            open={modalMode === 'create'}
            onClose={closeModal}
          />
          <CategoryFormModal
            mode="edit"
            category={selectedCategory}
            open={modalMode === 'edit'}
            onClose={closeModal}
          />
          <CategoryViewModal
            category={selectedCategory}
            open={modalMode === 'view'}
            onClose={closeModal}
          />
          <DeleteCategoryModal
            category={selectedCategory}
            open={modalMode === 'delete'}
            onClose={closeModal}
          />
        </>
      )}

      {modalEntity === 'supplier' && (
        <>
          <SupplierFormModal
            mode="create"
            open={modalMode === 'create'}
            onClose={closeModal}
          />
          <SupplierFormModal
            mode="edit"
            supplier={selectedSupplier}
            open={modalMode === 'edit'}
            onClose={closeModal}
          />
          <SupplierViewModal
            supplier={selectedSupplier}
            open={modalMode === 'view'}
            onClose={closeModal}
          />
          <DeleteSupplierModal
            supplier={selectedSupplier}
            open={modalMode === 'delete'}
            onClose={closeModal}
          />
        </>
      )}

      {modalEntity === 'kit' && (
        <>
          <KitFormModal mode="create" open={modalMode === 'create'} onClose={closeModal} />
          <KitFormModal
            mode="edit"
            kit={selectedKit}
            open={modalMode === 'edit'}
            onClose={closeModal}
          />
          <KitViewModal kit={selectedKit} open={modalMode === 'view'} onClose={closeModal} />
          <DeleteKitModal kit={selectedKit} open={modalMode === 'delete'} onClose={closeModal} />
        </>
      )}

      <ToastContainerView toasts={toasts} onRemove={removeToast} />
    </>
  )
}
