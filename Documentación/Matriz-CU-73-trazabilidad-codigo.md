# Matriz CU — Sprint Backlog Incremento I (73 filas)

| N° | RF | CU | Nombre | Evidencia en código |
|:--:|:---|:--:|:-------|:--------------------|
| 1 | RF01-02 | CU01 | Registrando cliente | ClientFormModal (create) → POST /api/clients |
| 2 | RF01-02 | CU04 | Eliminando registro de cliente | DeleteClientModal → DELETE /api/clients/:id |
| 3 | RF01-02 | CU06 | Buscando clientes | Buscador en ClientsTable |
| 4 | RF01-02 | CU07 | Listando clientes | ClientsTable → GET /api/clients |
| 5 | RF01-02 | CU08 | Visualizando detalle de cliente | ClientViewModal |
| 6 | RF01-02 | CU09 | Modificando datos del cliente | ClientFormModal (edit) → PUT /api/clients/:id |
| 7 | RF05-08 | CU15 | Creando órdenes de trabajo | OrderFormModal → POST /api/orders |
| 8 | RF05-08 | CU18 | Visualizando listado de órdenes | OrdersTable → GET /api/orders |
| 9 | RF05-08 | CU22 | Actualizando estado de orden | KanbanBoard → PUT /api/orders/:id |
| 10 | RF33 | CU109 | Iniciando sesión | LoginPage → POST /api/auth/login + JWT |
| 11 | RF01-02 | CU02 | Validando datos del cliente | ClientFormModal (validación react-hook-form) |
| 12 | RF01-02 | CU03 | Confirmando registro de cliente | ClientFormModal (submit) → useClientsStore.addClient |
| 13 | RF01-02 | CU03 | Confirmar registro del cliente (subflujo) | ClientFormModal (toast confirmación) |
| 14 | RF01-02 | CU05 | Verificando cliente duplicado | Sin implementación en client.service |
| 15 | RF03 | CU10 | Solicitando recuperación de contraseña | ForgotPasswordPage → /recuperar-contrasena |
| 16 | RF03 | CU11 | Restableciendo contraseña | ResetPasswordPage → /restablecer-contrasena |
| 17 | RF04 | CU12 | Creando rol | RoleFormModal (create) → useUsersStore |
| 18 | RF04 | CU13 | Modificando rol | RoleFormModal (edit) → useUsersStore |
| 19 | RF04 | CU14 | Asignando rol a usuario | UsersTable + PermissionsEditor |
| 20 | RF05-08 | CU16 | Asignando operador a orden | OrderFormModal (campo técnico) |
| 21 | RF05-08 | CU17 | Definiendo estados de la orden | KanbanBoard + OrderStatus en types |
| 22 | RF05-08 | CU19 | Filtrando órdenes de trabajo | Filtros en OrdersTable → useOrdersStore |
| 23 | RF05-08 | CU20 | Buscando órdenes de trabajo | Buscador en OrdersTable |
| 24 | RF05-08 | CU21 | Visualizando estado de órdenes | KanbanBoard + Badge de estado |
| 25 | RF05-08 | CU23 | Asignando automáticamente estado Pendiente | OrderFormModal (estado inicial) |
| 26 | RF05-08 | CU24 | Notificando cambio de estado | push.service (mock) + toast useOrdersStore |
| 27 | RF05-08 | CU25 | Registrando cambio en orden | audit.service → bitacora_auditoria |
| 28 | RF05-08 | CU26 | Visualizando historial de cambios | AuditReportPanel → GET /api/reports/audit |
| 29 | RF05-08 | CU27 | Consultando detalle de cambio | AuditReportPanel (valor anterior / nuevo) |
| 30 | RF05-08 | CU28 | Identificando usuario del cambio | AuditReportPanel (columna Usuario) |
| 31 | RF05-08 | CU29 | Consultando fecha y hora de cambio | AuditReportPanel → formatDateTime |
| 32 | RF11-12 | CU39 | Registrando equipo en inventario | ProductFormModal + EquipmentPanel |
| 33 | RF11-12 | CU40 | Validando datos del equipo | ProductFormModal (validación) |
| 34 | RF11-12 | CU41 | Clasificando tipo de equipo | CategoriesPanel + categoría Equipos |
| 35 | RF11-12 | CU42 | Verificando duplicidad de equipo | Sin implementación |
| 36 | RF11-12 | CU43 | Confirmando registro de equipo | ProductFormModal → useInventoryStore |
| 37 | RF11-12 | CU44 | Consultando inventario en tiempo real | InventoryPage → GET /api/assets |
| 38 | RF11-12 | CU45 | Filtrando maquinaria por categoría y estado | EquipmentPanel (filtros) |
| 39 | RF11-12 | CU46 | Verificando disponibilidad de equipo | EquipmentPanel (estado Operativo/Mantención) |
| 40 | RF11-12 | CU47 | Consultando orden asociada a equipo | mock equipment.ts (campo assignedTo) |
| 41 | RF11-12 | CU48 | Actualizando estado de mantenimiento | EquipmentPanel (columnas mantención, solo lectura) |
| 42 | RF13 | CU49 | Registrando estado de pago inicial | InvoiceFormModal → useBillingStore |
| 43 | RF13 | CU50 | Actualizando pago total de servicio | RegisterPaymentModal → markAsPaid / registerPayment |
| 44 | RF13 | CU51 | Registrando abono parcial de servicio | RegisterPaymentModal (monto parcial) |
| 45 | RF13 | CU52 | Consultando situación financiera de órdenes | BillingPage + BillingSummaryChart |
| 46 | RF17-21 | CU62 | Generando reporte financiero de ingresos | BillingReportPanel |
| 47 | RF17-21 | CU63 | Consultando ingresos por periodo | ReportPeriodSelect + BillingReportPanel |
| 48 | RF17-21 | CU64 | Exportando reporte financiero | exportReports → CSV |
| 49 | RF17-21 | CU65 | Generando reporte de costos operacionales | Sin implementación |
| 50 | RF17-21 | CU68 | Generando reporte de utilidad | Sin implementación |
| 51 | RF17-21 | CU69 | Consultando estado financiero | SummaryReportPanel + reportStats |
| 52 | RF17-21 | CU70 | Exportando reporte financiero completo | ReportsPage → Exportar todo |
| 53 | RF17-21 | CU71 | Reporte de trazabilidad de órdenes | OrdersReportPanel → exportOrdersReport |
| 54 | RF17-21 | CU72 | Reporte de uso y control de maquinaria | Sin implementación |
| 55 | RF17-21 | CU73 | Reporte de servicios por cliente | SummaryReportPanel → topClientsByOrders |
| 56 | RF17-21 | CU74 | Exportando reporte a PDF | ReportExportCatalog (PDF demo) |
| 57 | RF17-21 | CU75 | Descargando inventario en Excel | exportInventory → CSV |
| 58 | RF17-21 | CU76 | Generando reporte de cierre de mes | Sin implementación |
| 59 | RF22-26 | CU77 | Visualizando indicadores de ingresos | DashboardPage → getDashboardKpis |
| 60 | RF22-26 | CU78 | Monitoreando estado de órdenes | OrdersByStatusChart + RecentOrdersTable |
| 61 | RF22-26 | CU79 | Visualizando disponibilidad de maquinaria | EquipmentPanel (KPIs operativos) |
| 62 | RF22-26 | CU80 | Accediendo al panel principal | DashboardPage → ruta / |
| 63 | RF22-26 | CU81 | Visualizando indicadores generales | DashboardPage (KpiCard) |
| 64 | RF22-26 | CU82 | Visualizando estado de inventario y servicios | CriticalInventoryTable |
| 65 | RF22-26 | CU83 | Visualizando gráfico ingresos vs gastos | Sin implementación |
| 66 | RF22-26 | CU84 | Visualizando uso de recursos | Sin implementación |
| 67 | RF22-26 | CU85 | Visualizando comportamiento de clientes | Sin implementación |
| 68 | RF33 | CU109 | Ingresar credenciales | LoginPage (campos email/contraseña) |
| 69 | RF33 | CU109 | Validación de credenciales | auth.service (bcrypt + JWT) |
| 70 | RF33 | CU110 | Cerrando sesión | Header → authService.logout |
| 71 | RF37 | CU125 | Cambiando tema de la interfaz | AppearanceSettingsPanel → useSettingsStore |
| 72 | RF37 | CU126 | Personalizando colores del menú | Sin implementación |
| 73 | RF37 | CU127 | Ajustando visualización de tablas | Sin implementación |

---

**Nota:** CU128 (paleta gráficos) y CU129 (restablecer apariencia) están en el catálogo extendido pero no forman parte de estas 73 filas del Sprint Backlog §3.2.

**Pie sugerido:** *Tabla X.X — Matriz de trazabilidad CU / evidencia en código (Incremento I). Fuente: Elaboración propia, 2026.*
