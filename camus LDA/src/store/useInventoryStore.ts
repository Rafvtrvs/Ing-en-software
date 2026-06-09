import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  InventoryStatus,
  InventoryTab,
  Product,
  ProductCategory,
  ProductKit,
  StockMovement,
  Supplier,
} from '@/types'
import { initialMovements, initialProducts } from '@/data/mock/inventory'
import {
  initialCategories,
  initialSuppliers,
} from '@/data/mock/categories-suppliers'
import { initialKits } from '@/data/mock/kits'
import { computeStockStatus } from '@/features/inventory/utils/inventoryStatus'
import { assetsService } from '@/services/assetsService'

export type InventoryModalMode = 'create' | 'edit' | 'view' | 'delete' | null
export type ModalEntity = 'product' | 'category' | 'supplier' | 'kit'

export interface ToastMessage {
  id: number
  type: 'success' | 'error' | 'info'
  message: string
}

interface InventoryState {
  products: Product[]
  apiAvailable: boolean
  categories: ProductCategory[]
  suppliers: Supplier[]
  kits: ProductKit[]
  movements: StockMovement[]
  activeTab: InventoryTab
  modalEntity: ModalEntity | null
  modalMode: InventoryModalMode
  selectedProduct: Product | null
  selectedCategory: ProductCategory | null
  selectedSupplier: Supplier | null
  selectedKit: ProductKit | null
  statusFilter: InventoryStatus | 'all'
  categoryFilter: string
  showFilters: boolean
  toasts: ToastMessage[]
  setActiveTab: (tab: InventoryTab) => void
  syncProductsFromApi: () => Promise<void>
  addProduct: (product: Omit<Product, 'id' | 'status'>) => void
  updateProduct: (id: string, data: Partial<Omit<Product, 'id'>>) => void
  deleteProduct: (id: string) => void
  addCategory: (category: Omit<ProductCategory, 'id'>) => void
  updateCategory: (id: string, data: Partial<Omit<ProductCategory, 'id'>>) => void
  deleteCategory: (id: string) => boolean
  addSupplier: (supplier: Omit<Supplier, 'id'>) => void
  updateSupplier: (id: string, data: Partial<Omit<Supplier, 'id'>>) => void
  deleteSupplier: (id: string) => void
  addKit: (kit: Omit<ProductKit, 'id'>) => void
  updateKit: (id: string, data: Partial<Omit<ProductKit, 'id'>>) => void
  deleteKit: (id: string) => void
  openKitModal: (mode: Exclude<InventoryModalMode, null>, kit?: ProductKit | null) => void
  openProductModal: (mode: Exclude<InventoryModalMode, null>, product?: Product | null) => void
  openCategoryModal: (mode: Exclude<InventoryModalMode, null>, category?: ProductCategory | null) => void
  openSupplierModal: (mode: Exclude<InventoryModalMode, null>, supplier?: Supplier | null) => void
  openCreateModal: () => void
  openEditModal: (product: Product) => void
  openViewModal: (product: Product) => void
  openDeleteModal: (product: Product) => void
  closeModal: () => void
  setStatusFilter: (status: InventoryStatus | 'all') => void
  setCategoryFilter: (category: string) => void
  toggleFilters: () => void
  getActiveCategoryNames: () => string[]
  addToast: (message: string, type?: ToastMessage['type']) => void
  removeToast: (id: number) => void
}

let toastId = 0

function safeId(prefix = '') {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}${crypto.randomUUID()}`
  }
  return `${prefix}${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function withStatus(
  data: Partial<Product> & { currentStock: number; minStock: number },
): Pick<Product, 'status'> {
  return {
    status: computeStockStatus(data.currentStock, data.minStock),
  }
}

export const useInventoryStore = create<InventoryState>()(
  persist(
    (set, get) => ({
      products: initialProducts,
      apiAvailable: false,
      categories: initialCategories,
      suppliers: initialSuppliers,
      kits: initialKits,
      movements: initialMovements,
      activeTab: 'inventario',
      modalEntity: null,
      modalMode: null,
      selectedProduct: null,
      selectedCategory: null,
      selectedSupplier: null,
      selectedKit: null,
      statusFilter: 'all',
      categoryFilter: 'all',
      showFilters: false,
      toasts: [],

      setActiveTab: (tab) => set({ activeTab: tab }),

      // Carga los productos (insumos) desde el backend (PostgreSQL).
      // Si no responde, se conservan los datos locales.
      syncProductsFromApi: async () => {
        try {
          const products = await assetsService.list()
          set({ products, apiAvailable: true })
        } catch {
          set({ apiAvailable: false })
        }
      },

      getActiveCategoryNames: () =>
        get()
          .categories.filter((c) => c.status === 'Activa')
          .map((c) => c.name),

      addProduct: (product) => {
        const tempId = safeId()
        set((state) => ({
          products: [
            { ...product, id: tempId, ...withStatus(product) },
            ...state.products,
          ],
        }))
        assetsService
          .create(product)
          .then((created) =>
            set((state) => ({
              products: state.products.map((p) =>
                p.id === tempId ? created : p,
              ),
              apiAvailable: true,
            })),
          )
          .catch(() => set({ apiAvailable: false }))
      },

      updateProduct: (id, data) => {
        set((state) => {
          const products = state.products.map((p) => {
            if (p.id !== id) return p
            const updated = { ...p, ...data }
            return { ...updated, ...withStatus(updated) }
          })
          const selectedProduct =
            state.selectedProduct?.id === id
              ? products.find((p) => p.id === id) ?? null
              : state.selectedProduct
          return { products, selectedProduct }
        })
        assetsService
          .update(id, data)
          .then(() => set({ apiAvailable: true }))
          .catch(() => set({ apiAvailable: false }))
      },

      deleteProduct: (id) => {
        set((state) => ({
          products: state.products.filter((p) => p.id !== id),
          ...(state.selectedProduct?.id === id
            ? { selectedProduct: null, modalMode: null, modalEntity: null }
            : null),
        }))
        assetsService
          .remove(id)
          .then(() => set({ apiAvailable: true }))
          .catch(() => set({ apiAvailable: false }))
      },

      addCategory: (category) =>
        set((state) => ({
          categories: [{ ...category, id: safeId('cat-') }, ...state.categories],
        })),

      updateCategory: (id, data) =>
        set((state) => {
          const old = state.categories.find((c) => c.id === id)
          const categories = state.categories.map((c) =>
            c.id === id ? { ...c, ...data } : c,
          )
          let products = state.products
          if (old && data.name && data.name !== old.name) {
            products = products.map((p) =>
              p.category === old.name ? { ...p, category: data.name! } : p,
            )
          }
          const selectedCategory =
            state.selectedCategory?.id === id
              ? categories.find((c) => c.id === id) ?? null
              : state.selectedCategory
          return { categories, products, selectedCategory }
        }),

      deleteCategory: (id) => {
        const state = get()
        const category = state.categories.find((c) => c.id === id)
        if (!category) return false
        const inUse = state.products.some((p) => p.category === category.name)
        if (inUse) return false
        set({
          categories: state.categories.filter((c) => c.id !== id),
          ...(state.selectedCategory?.id === id
            ? { selectedCategory: null, modalMode: null, modalEntity: null }
            : null),
        })
        return true
      },

      addSupplier: (supplier) =>
        set((state) => ({
          suppliers: [{ ...supplier, id: safeId('sup-') }, ...state.suppliers],
        })),

      updateSupplier: (id, data) =>
        set((state) => {
          const suppliers = state.suppliers.map((s) =>
            s.id === id ? { ...s, ...data } : s,
          )
          const selectedSupplier =
            state.selectedSupplier?.id === id
              ? suppliers.find((s) => s.id === id) ?? null
              : state.selectedSupplier
          return { suppliers, selectedSupplier }
        }),

      deleteSupplier: (id) =>
        set((state) => ({
          suppliers: state.suppliers.filter((s) => s.id !== id),
          ...(state.selectedSupplier?.id === id
            ? { selectedSupplier: null, modalMode: null, modalEntity: null }
            : null),
        })),

      addKit: (kit) =>
        set((state) => ({
          kits: [{ ...kit, id: safeId('kit-') }, ...state.kits],
        })),

      updateKit: (id, data) =>
        set((state) => {
          const kits = state.kits.map((k) => (k.id === id ? { ...k, ...data } : k))
          const selectedKit =
            state.selectedKit?.id === id
              ? kits.find((k) => k.id === id) ?? null
              : state.selectedKit
          return { kits, selectedKit }
        }),

      deleteKit: (id) =>
        set((state) => ({
          kits: state.kits.filter((k) => k.id !== id),
          ...(state.selectedKit?.id === id
            ? { selectedKit: null, modalMode: null, modalEntity: null }
            : null),
        })),

      openKitModal: (mode, kit = null) =>
        set({
          modalEntity: 'kit',
          modalMode: mode,
          selectedKit: kit,
          selectedProduct: null,
          selectedCategory: null,
          selectedSupplier: null,
        }),

      openProductModal: (mode, product = null) =>
        set({
          modalEntity: 'product',
          modalMode: mode,
          selectedProduct: product,
          selectedCategory: null,
          selectedSupplier: null,
          selectedKit: null,
        }),

      openCategoryModal: (mode, category = null) =>
        set({
          modalEntity: 'category',
          modalMode: mode,
          selectedCategory: category,
          selectedProduct: null,
          selectedSupplier: null,
          selectedKit: null,
        }),

      openSupplierModal: (mode, supplier = null) =>
        set({
          modalEntity: 'supplier',
          modalMode: mode,
          selectedSupplier: supplier,
          selectedProduct: null,
          selectedCategory: null,
          selectedKit: null,
        }),

      openCreateModal: () => get().openProductModal('create'),
      openEditModal: (product) => get().openProductModal('edit', product),
      openViewModal: (product) => get().openProductModal('view', product),
      openDeleteModal: (product) => get().openProductModal('delete', product),

      closeModal: () =>
        set({
          modalEntity: null,
          modalMode: null,
          selectedProduct: null,
          selectedCategory: null,
          selectedSupplier: null,
          selectedKit: null,
        }),

      setStatusFilter: (status) => set({ statusFilter: status }),
      setCategoryFilter: (category) => set({ categoryFilter: category }),
      toggleFilters: () => set((state) => ({ showFilters: !state.showFilters })),

      addToast: (message, type = 'success') => {
        const id = ++toastId
        set((state) => ({ toasts: [...state.toasts, { id, message, type }] }))
        setTimeout(() => {
          useInventoryStore.getState().removeToast(id)
        }, 3500)
      },

      removeToast: (id) =>
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
    }),
    {
      name: 'camus_inventory_store_v1',
      partialize: (state) => ({
        products: state.products,
        categories: state.categories,
        suppliers: state.suppliers,
        kits: state.kits,
        movements: state.movements,
      }),
      merge: (persisted, current) => {
        const p = persisted as Partial<InventoryState> | undefined
        return {
          ...current,
          ...p,
          products: (p?.products ?? current.products).map((prod) => ({
            ...prod,
            ...withStatus(prod),
          })),
          categories: p?.categories ?? current.categories,
          suppliers: p?.suppliers ?? current.suppliers,
          kits: p?.kits ?? current.kits,
          movements: p?.movements ?? current.movements,
        }
      },
    },
  ),
)
