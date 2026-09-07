import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { RequireAuth } from '@/components/auth/RequireAuth'
import { LoginPage } from '@/features/auth/LoginPage'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { ClientsPage } from '@/features/clients/ClientsPage'
import { OrdersPage } from '@/features/orders/OrdersPage'
import { InventoryPage } from '@/features/inventory/InventoryPage'
import { OperationsPage } from '@/features/operations/OperationsPage'
import { BillingPage } from '@/features/billing/BillingPage'
import { ReportsPage } from '@/features/reports/ReportsPage'
import { UsersPage } from '@/features/users/UsersPage'
import { ParametersPage } from '@/features/parameters/ParametersPage'
import { SettingsPage } from '@/features/settings/SettingsPage'
import { SupportPage } from '@/features/support/SupportPage'
import { ROUTES } from '@/constants/routes'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: ROUTES.CLIENTES.slice(1), element: <ClientsPage /> },
      { path: ROUTES.ORDENES.slice(1), element: <OrdersPage /> },
      { path: ROUTES.INVENTARIO.slice(1), element: <InventoryPage /> },
      { path: ROUTES.OPERACIONES.slice(1), element: <OperationsPage /> },
      { path: ROUTES.FACTURACION.slice(1), element: <BillingPage /> },
      { path: ROUTES.REPORTES.slice(1), element: <ReportsPage /> },
      { path: ROUTES.USUARIOS.slice(1), element: <UsersPage /> },
      { path: ROUTES.PARAMETROS.slice(1), element: <ParametersPage /> },
      { path: ROUTES.CONFIGURACION.slice(1), element: <SettingsPage /> },
      { path: ROUTES.SOPORTE.slice(1), element: <SupportPage /> },
      { path: '*', element: <Navigate to={ROUTES.DASHBOARD} replace /> },
    ],
  },
])
