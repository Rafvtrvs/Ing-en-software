# FASE 1 — Mapeo RF → CDS → Elemento UI

## RF60 — Disponibilidad y asignaciones de operadores

| CDS | Caso de uso | Componente / Acción |
|-----|-------------|---------------------|
| 209 | Consultar disponibilidad de operadores | `OperatorAvailabilityPanel` — filtros fecha/OT, tabla disponible/ocupado, botón Exportar |
| 210 | Consultar asignaciones de operadores | `OperatorAssignmentsPanel` — select operador, tabla OT asignadas, Ver detalle |

**Ubicación:** `/operaciones` → `OperationsPage`

---

## RF61 — Cancelación y anulación de órdenes

| CDS | Caso de uso | Componente / Acción |
|-----|-------------|---------------------|
| 211 | Cancelando orden de trabajo | `CancelOrderModal` — botón "Cancelar Orden" en `OrderDetailDrawer` |
| 212 | Anulación de orden de trabajo duplicada | `AnnulOrderModal` — botón "Anular Orden" en `OrderDetailDrawer` |

**Ubicación:** `/ordenes` → detalle OT (drawer)

---

## RF62 — Insumos en orden de trabajo

| CDS | Caso de uso | Componente / Acción |
|-----|-------------|---------------------|
| 213 | Registrando uso de insumos | `OrderSuppliesPanel` — formulario + botón "Registrar insumos" |
| 214 | Actualización de stock (secundario) | Automático vía `useInventoryStore.deductStock` al registrar |
| 215 | Validando disponibilidad de insumos | `OrderSuppliesPanel` — botón "Validar disponibilidad" |

**Ubicación:** `/ordenes` → detalle OT → panel Insumos Utilizados

---

## RF63 — Aprobación de órdenes finalizadas

| CDS | Caso de uso | Componente / Acción |
|-----|-------------|---------------------|
| 216 | Aprobando orden finalizada | `OrderApprovalPanel` + `CompletedOrdersApprovalPanel` |
| 217 | Revisión de antecedentes | Checklist en `OrderApprovalPanel` al presionar "Aprobar Orden" |
| 218 | Registro de aprobación | `useOrdersStore.approveOrder` — guarda fecha, hora y usuario |

**Ubicación:** `/ordenes` → panel Órdenes Finalizadas + detalle OT

---

## RF64 — Gestión de usuarios y clientes

| CDS | Caso de uso | Componente / Acción |
|-----|-------------|---------------------|
| 219 | Eliminando usuarios | `DeleteUserModal` — detalle completo + confirmación |
| 220 | Eliminación de cliente | `DeleteClientModal` — detalle + OT asociadas |
| 221 | Desactivando usuario | `DeactivateUserModal` — acción en `UsersTable` |
| 222 | Reactivación de usuario | `ReactivateUserModal` — acción en `UsersTable` |
| 223 | Historial desactivación/eliminación | `UserLifecycleHistoryPanel` — tab Historial en `/usuarios` |

**Ubicación:** `/usuarios` y `/clientes`

---

# FASE 2 — Mapeo RF → CDS → Elemento UI

## RF65 — Comentarios en orden de trabajo

| CDS | Caso de uso | Componente / Acción |
|-----|-------------|---------------------|
| 224 | Registrando comentarios en OT | `OrderCommentsPanel` — textarea + botón "Agregar comentario" |
| 225 | Consulta de comentarios | `OrderCommentsPanel` — lista con autor, fecha y hora |
| 226 | Trazabilidad de comentarios | Automático al guardar (autor, fecha, hora del usuario sesión) |

**Ubicación:** `/ordenes` → detalle OT (drawer)

---

## RF66 — Reprogramación de fecha de ejecución

| CDS | Caso de uso | Componente / Acción |
|-----|-------------|---------------------|
| 227 | Reprogramando fecha de ejecución | `RescheduleOrderModal` — botón "Reprogramar fecha" en drawer |
| 228 | Validación de disponibilidad | Indicador en modal + `validateRescheduleDate` (insumos/maquinaria) |
| 229 | Historial de reprogramación | `OrderRescheduleHistoryPanel` — tabla solo lectura en drawer |

**Ubicación:** `/ordenes` → detalle OT

---

## RF67 — Disponibilidad de maquinaria

| CDS | Caso de uso | Componente / Acción |
|-----|-------------|---------------------|
| 230 | Consultando disponibilidad | `MachineryAvailabilityPanel` — KPIs + tabla |
| 231 | Filtrado de disponibilidad | Select estado: Todos / Activo / En uso / No disponible |
| 232 | Determinando disponibilidad | Badges + motivo (asignación/mantenimiento) vía `determineMachineryAvailability` |

**Ubicación:** `/inventario` → tab Equipos

---

## RF68 — Solicitud de modificación de OT

| CDS | Caso de uso | Componente / Acción |
|-----|-------------|---------------------|
| 233 | Solicitando modificación | `OrderModificationRequestModal` — botón en drawer (operador asignado) |
| 234 | Verificación de solicitud | `ModificationRequestsPanel` — Aprobar / Rechazar |
| 235 | Historial de modificaciones | `OrderModificationHistoryPanel` — tabla solo lectura en drawer |

**Ubicación:** `/ordenes` → drawer + panel admin

---

## RF69 — Protección eliminación de clientes

| CDS | Caso de uso | Componente / Acción |
|-----|-------------|---------------------|
| 236 | Intentando eliminar con OT activas | `DeleteClientModal` — modal bloqueo "No es posible eliminar" |
| 237 | Verificando OT activas | `getClientActiveOrders` — validación previa a eliminar |

**Ubicación:** `/clientes` → Eliminar cliente
