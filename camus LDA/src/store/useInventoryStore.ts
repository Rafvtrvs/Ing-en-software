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
import {
  initialCategories,
  initialSuppliers,
} from '@/data/mock/categories-suppliers'
import { computeStockStatus } from '@/features/inventory/utils/inventoryStatus'
import { findDuplicateProductCode } from '@/features/inventory/utils/productDuplicates'
import { allocateProductCode } from '@/features/inventory/utils/productCode'
import { assetsService } from '@/services/assetsService'
import { kitsService } from '@/services/kitsService'
import { stockMovementsService } from '@/services/stockMovementsService'
import { useNotificationsStore } from '@/store/useNotificationsStore'
import axios from 'axios'
import { isDemoMode, isOfflineApiError } from '@/utils/demoMode'

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
  syncKitsFromApi: () => Promise<void>
  syncMovementsFromApi: () => Promise<void>
  addProduct: (
    product: Omit<Product, 'id' | 'status'>,
  ) => Promise<{ ok: boolean; field?: 'code'; message?: string }>
  updateProduct: (
    id: string,
    data: Partial<Omit<Product, 'id'>>,
  ) => Promise<{ ok: boolean; field?: 'code'; message?: string }>
  deleteProduct: (id: string) => Promise<{ ok: boolean; message?: string }>
  addCategory: (category: Omit<ProductCategory, 'id'>) => void
  updateCategory: (id: string, data: Partial<Omit<ProductCategory, 'id'>>) => void
  deleteCategory: (id: string) => boolean
  addSupplier: (supplier: Omit<Supplier, 'id'>) => void
  updateSupplier: (id: string, data: Partial<Omit<Supplier, 'id'>>) => void
  deleteSupplier: (id: string) => void
  addKit: (
    kit: Omit<ProductKit, 'id'>,
  ) => Promise<{ ok: boolean; message?: string }>
  updateKit: (
    id: string,
    data: Partial<Omit<ProductKit, 'id'>>,
  ) => Promise<{ ok: boolean; message?: string }>
  deleteKit: (id: string) => Promise<{ ok: boolean; message?: string }>
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
  deductStock: (
    productId: string,
    quantity: number,
    orderId?: string,
  ) => Promise<{ ok: boolean; message?: string }>
  restoreStock: (
    productId: string,
    quantity: number,
    orderId?: string,
  ) => Promise<{ ok: boolean; message?: string }>
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
  data: Partial<Product> & {
    currentStock: number
    minStock: number
    category?: string
  },
): Pick<Product, 'status'> {
  return {
    status: computeStockStatus(data.currentStock, data.minStock, data.category),
  }
}

function apiErrorMessage(
  err: unknown,
  fallback: string,
): { message: string; field?: 'code' } {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { error?: string; field?: 'code' } | undefined
    if (data?.error) {
      return { message: data.error, field: data.field }
    }
  }
  return { message: fallback }
}

export const useInventoryStore = create<InventoryState>()(
  persist(
    (set, get) => ({
      // Vacío al inicio: la fuente de verdad es PostgreSQL vía syncProductsFromApi
      products: [],
      apiAvailable: false,
      categories: initialCategories,
      suppliers: initialSuppliers,
      kits: [],
      movements: [],
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
          const products = (await assetsService.list()).map((prod) => ({
            ...prod,
            ...withStatus(prod),
          }))
          set({ products, apiAvailable: true })
        } catch {
          set({ apiAvailable: false })
        }
      },

      syncKitsFromApi: async () => {
        try {
          const kits = await kitsService.list()
          set({ kits, apiAvailable: true })
        } catch {
          set({ apiAvailable: false })
        }
      },

      syncMovementsFromApi: async () => {
        try {
          const movements = await stockMovementsService.list()
          set({ movements, apiAvailable: true })
        } catch {
          set({ apiAvailable: false })
        }
      },

      getActiveCategoryNames: () =>
        get()
          .categories.filter((c) => c.status === 'Activa')
          .map((c) => c.name),

      addProduct: async (product) => {
        const state = useInventoryStore.getState()
        const code = allocateProductCode(
          state.products,
          product.category,
          product.code,
        )
        const toCreate = { ...product, code }
        const duplicate = findDuplicateProductCode(state.products, toCreate.code)
        if (duplicate) {
          state.addToast(duplicate.message, 'error')
          return { ok: false, field: duplicate.field, message: duplicate.message }
        }

        const tempId = safeId()
        set((s) => ({
          products: [
            { ...toCreate, id: tempId, ...withStatus(toCreate) },
            ...s.products,
          ],
        }))

        try {
          const created = await assetsService.create(toCreate)
          const normalized = { ...created, ...withStatus(created) }
          set((s) => {
            const withoutTemp = s.products.filter((p) => p.id !== tempId)
            const idx = withoutTemp.findIndex(
              (p) => p.id === normalized.id || p.code === normalized.code,
            )
            const products =
              idx >= 0
                ? withoutTemp.map((p, i) => (i === idx ? normalized : p))
                : [normalized, ...withoutTemp]
            return { products, apiAvailable: true }
          })
          await Promise.all([
            get().syncProductsFromApi(),
            get().syncMovementsFromApi(),
          ])
          useNotificationsStore.getState().pushProductCreated({
            code: created.code,
            name: created.name,
            category: created.category,
          })
          return { ok: true }
        } catch (err) {
          if (isDemoMode() || isOfflineApiError(err)) {
            set({ apiAvailable: false })
            useInventoryStore.getState().addToast(
              'Producto guardado en modo local (API no disponible)',
              'info',
            )
            return { ok: true }
          }
          set((s) => ({
            products: s.products.filter((p) => p.id !== tempId),
          }))
          const apiErr = apiErrorMessage(err, 'No se pudo crear el producto')
          useInventoryStore.getState().addToast(apiErr.message, 'error')
          return { ok: false, field: apiErr.field, message: apiErr.message }
        }
      },

      updateProduct: async (id, data) => {
        const state = useInventoryStore.getState()
        const current = state.products.find((p) => p.id === id)
        if (!current) return { ok: false }

        const duplicate = findDuplicateProductCode(
          state.products,
          data.code ?? current.code,
          id,
        )
        if (duplicate) {
          state.addToast(duplicate.message, 'error')
          return { ok: false, field: duplicate.field, message: duplicate.message }
        }

        const previous = { ...current, ...withStatus(current) }
        set((s) => {
          const products = s.products.map((p) => {
            if (p.id !== id) return p
            const updated = { ...p, ...data }
            return { ...updated, ...withStatus(updated) }
          })
          const selectedProduct =
            s.selectedProduct?.id === id
              ? products.find((p) => p.id === id) ?? null
              : s.selectedProduct
          return { products, selectedProduct }
        })

        if (isDemoMode()) {
          useInventoryStore.getState().addToast('Producto actualizado correctamente')
          return { ok: true }
        }

        try {
          const updated = await assetsService.update(id, data)
          const normalized = { ...updated, ...withStatus(updated) }
          set((s) => ({
            apiAvailable: true,
            products: s.products.map((p) => (p.id === id ? normalized : p)),
            selectedProduct:
              s.selectedProduct?.id === id ? normalized : s.selectedProduct,
          }))
          await Promise.all([
            get().syncProductsFromApi(),
            get().syncMovementsFromApi(),
          ])
          useInventoryStore.getState().addToast('Producto actualizado correctamente')
          return { ok: true }
        } catch (err) {
          if (isOfflineApiError(err)) {
            useInventoryStore.getState().addToast(
              'Producto actualizado correctamente (modo demo)',
            )
            return { ok: true }
          }
          set((s) => ({
            products: s.products.map((p) => (p.id === id ? previous : p)),
          }))
          const apiErr = apiErrorMessage(err, 'No se pudo actualizar el producto')
          useInventoryStore.getState().addToast(apiErr.message, 'error')
          return { ok: false, field: apiErr.field, message: apiErr.message }
        }
      },

      deleteProduct: async (id) => {
        const previous = get().products
        set((state) => ({
          products: state.products.filter((p) => p.id !== id),
          ...(state.selectedProduct?.id === id
            ? { selectedProduct: null, modalMode: null, modalEntity: null }
            : null),
        }))

        if (isDemoMode()) {
          return { ok: true }
        }

        try {
          await assetsService.remove(id)
          set({ apiAvailable: true })
          await get().syncProductsFromApi()
          return { ok: true }
        } catch (err) {
          if (isOfflineApiError(err)) {
            set({ apiAvailable: false })
            return { ok: true }
          }
          set({ products: previous, apiAvailable: false })
          const apiErr = apiErrorMessage(err, 'No se pudo eliminar el producto')
          useInventoryStore.getState().addToast(apiErr.message, 'error')
          return { ok: false, message: apiErr.message }
        }
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

      addKit: async (kit) => {
        try {
          const created = await kitsService.create({
            name: kit.name,
            description: kit.description,
            status: kit.status,
            items: kit.items.map((i) => ({
              productId: i.productId,
              quantity: i.quantity,
            })),
          })
          set((s) => ({
            kits: [created, ...s.kits.filter((k) => k.id !== created.id)],
            apiAvailable: true,
          }))
          return { ok: true }
        } catch (err) {
          if (isDemoMode() || isOfflineApiError(err)) {
            const local: ProductKit = { ...kit, id: safeId('kit-') }
            set((s) => ({ kits: [local, ...s.kits], apiAvailable: false }))
            return { ok: true }
          }
          const apiErr = apiErrorMessage(err, 'No se pudo crear el kit')
          return { ok: false, message: apiErr.message }
        }
      },

      updateKit: async (id, data) => {
        const current = get().kits.find((k) => k.id === id)
        if (!current) return { ok: false, message: 'Kit no encontrado' }
        const previous = { ...current }
        const optimistic: ProductKit = { ...current, ...data }
        set((s) => ({
          kits: s.kits.map((k) => (k.id === id ? optimistic : k)),
          selectedKit:
            s.selectedKit?.id === id ? optimistic : s.selectedKit,
        }))

        try {
          const updated = await kitsService.update(id, {
            name: data.name,
            description: data.description,
            status: data.status,
            items: data.items?.map((i) => ({
              productId: i.productId,
              quantity: i.quantity,
            })),
          })
          set((s) => ({
            kits: s.kits.map((k) => (k.id === id ? updated : k)),
            selectedKit: s.selectedKit?.id === id ? updated : s.selectedKit,
            apiAvailable: true,
          }))
          return { ok: true }
        } catch (err) {
          if (isDemoMode() || isOfflineApiError(err)) {
            set({ apiAvailable: false })
            return { ok: true }
          }
          set((s) => ({
            kits: s.kits.map((k) => (k.id === id ? previous : k)),
            selectedKit: s.selectedKit?.id === id ? previous : s.selectedKit,
            apiAvailable: false,
          }))
          const apiErr = apiErrorMessage(err, 'No se pudo actualizar el kit')
          return { ok: false, message: apiErr.message }
        }
      },

      deleteKit: async (id) => {
        const previous = get().kits
        set((state) => ({
          kits: state.kits.filter((k) => k.id !== id),
          ...(state.selectedKit?.id === id
            ? { selectedKit: null, modalMode: null, modalEntity: null }
            : null),
        }))
        try {
          await kitsService.remove(id)
          set({ apiAvailable: true })
          return { ok: true }
        } catch (err) {
          if (isDemoMode() || isOfflineApiError(err)) {
            set({ apiAvailable: false })
            return { ok: true }
          }
          set({ kits: previous, apiAvailable: false })
          const apiErr = apiErrorMessage(err, 'No se pudo eliminar el kit')
          return { ok: false, message: apiErr.message }
        }
      },

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

      /** RF62 CDS 214 — descuenta stock y registra movimiento en PostgreSQL */
      deductStock: async (productId, quantity, orderId) => {
        const product = get().products.find((p) => p.id === productId)
        if (!product) {
          return { ok: false, message: 'Producto no encontrado en inventario' }
        }
        if (quantity <= 0) {
          return { ok: false, message: 'La cantidad debe ser mayor a cero' }
        }
        if (product.currentStock < quantity) {
          return {
            ok: false,
            message: `Stock insuficiente para "${product.name}"`,
          }
        }

        const detail = orderId ? `Uso en OT ${orderId}` : 'Uso en orden de trabajo'

        try {
          const { movement, product: updatedProduct } =
            await stockMovementsService.create({
              productId,
              type: 'Salida',
              quantity,
              detail,
              orderId,
            })
          set((state) => ({
            apiAvailable: true,
            products: state.products.map((p) =>
              p.id === productId
                ? { ...updatedProduct, ...withStatus(updatedProduct) }
                : p,
            ),
            movements: [
              movement,
              ...state.movements.filter((m) => m.id !== movement.id),
            ],
          }))
          return { ok: true }
        } catch (err) {
          if (isDemoMode() || isOfflineApiError(err)) {
            const now = new Date().toLocaleString('es-CL')
            const currentStock = Math.max(0, product.currentStock - quantity)
            const movement: StockMovement = {
              id: safeId('mov-'),
              productId,
              product: product.name,
              type: 'Salida',
              quantity,
              date: now,
              detail,
              user: 'Sistema',
              orderId,
              createdAt: new Date().toISOString(),
            }
            set((state) => ({
              apiAvailable: false,
              products: state.products.map((p) => {
                if (p.id !== productId) return p
                const updated = { ...p, currentStock }
                return { ...updated, ...withStatus(updated) }
              }),
              movements: [movement, ...state.movements],
            }))
            return { ok: true }
          }
          const apiErr = apiErrorMessage(err, 'No se pudo actualizar el stock')
          return { ok: false, message: apiErr.message }
        }
      },

      /** Devuelve stock a bodega y registra movimiento en PostgreSQL */
      restoreStock: async (productId, quantity, orderId) => {
        const product = get().products.find((p) => p.id === productId)
        if (!product) {
          return { ok: false, message: 'Producto no encontrado en inventario' }
        }
        if (quantity <= 0) {
          return { ok: false, message: 'La cantidad debe ser mayor a cero' }
        }

        const detail = orderId
          ? `Devolución por baja de insumo en OT ${orderId}`
          : 'Devolución por baja de insumo en OT'

        try {
          const { movement, product: updatedProduct } =
            await stockMovementsService.create({
              productId,
              type: 'Entrada',
              quantity,
              detail,
              orderId,
            })
          set((state) => ({
            apiAvailable: true,
            products: state.products.map((p) =>
              p.id === productId
                ? { ...updatedProduct, ...withStatus(updatedProduct) }
                : p,
            ),
            movements: [
              movement,
              ...state.movements.filter((m) => m.id !== movement.id),
            ],
          }))
          return { ok: true }
        } catch (err) {
          if (isDemoMode() || isOfflineApiError(err)) {
            const now = new Date().toLocaleString('es-CL')
            const currentStock = product.currentStock + quantity
            const movement: StockMovement = {
              id: safeId('mov-'),
              productId,
              product: product.name,
              type: 'Entrada',
              quantity,
              date: now,
              detail,
              user: 'Sistema',
              orderId,
              createdAt: new Date().toISOString(),
            }
            set((state) => ({
              apiAvailable: false,
              products: state.products.map((p) => {
                if (p.id !== productId) return p
                const updated = { ...p, currentStock }
                return { ...updated, ...withStatus(updated) }
              }),
              movements: [movement, ...state.movements],
            }))
            return { ok: true }
          }
          const apiErr = apiErrorMessage(err, 'No se pudo devolver el stock')
          return { ok: false, message: apiErr.message }
        }
      },

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
      // v4: productos y movimientos ya no se cachean en localStorage (evita tapar Postgres)
      name: 'camus_inventory_store_v4',
      partialize: (state) => ({
        categories: state.categories,
        suppliers: state.suppliers,
      }),
      merge: (persisted, current) => {
        const p = persisted as Partial<InventoryState> | undefined
        const savedCategories = p?.categories ?? current.categories
        const knownNames = new Set(
          savedCategories.map((c) => c.name.trim().toLowerCase()),
        )
        const missingMachineryCats = initialCategories.filter(
          (c) => !knownNames.has(c.name.trim().toLowerCase()),
        )
        return {
          ...current,
          ...p,
          products: current.products,
          categories: [...savedCategories, ...missingMachineryCats],
          suppliers: p?.suppliers ?? current.suppliers,
          kits: current.kits,
          movements: current.movements,
        }
      },
    },
  ),
)
