# Mapeo RF43–RF70 → CU → Elemento UI

Fuente: documentación Grupo 21 (Documento 0 MODI). Implementación frontend en `camus LDA`.

## RF43 — Registro de OT en terreno

| CU | Elemento UI |
|----|-------------|
| CU-147 | `OperationsPage` → botón **Registrar orden de trabajo** → `FieldOrderRegisterModal` paso 1 (datos iniciales / iniciar registro) |
| CU-148 | `FieldOrderRegisterModal` paso 2 (formulario completo, guardado temporal u envío; integración offline vía `queueOfflineEntry`) |

**Ruta:** `/operaciones`

## RF46 — Modo offline y sincronización

| CU | Elemento UI |
|----|-------------|
| CU-155 | `OfflineSyncPanel` → `Switch` **Modo sin conexión** (`setOfflineMode`) |
| CU-156 | `OfflineSyncPanel` → sincronización automática / botón **Sincronizar pendientes** (`syncPendingEntries`, `lastAutoSyncAt`) |
| CU-157 | `OfflineSyncPanel` → tabla de estados (`syncEntries`, badges pendiente/sincronizado/error) |

**Ruta:** `/operaciones` (panel inferior)

## RF47 — Reporte intervenciones de terceros

| CU | Elemento UI |
|----|-------------|
| CU-158 | `ReportsPage` tab **Terceros** → `ThirdPartyInterventionsReportPanel` → **Generar reporte** (vista previa HTML) |
| CU-159 | Mismos filtros (fecha, cliente, búsqueda) en `ThirdPartyInterventionsReportPanel` |

**Ruta:** `/reportes?tab=terceros`

## RF55 — Anotación sobre imagen de OT

| CU | Elemento UI |
|----|-------------|
| CU-193 | `OrderPhotoAnnotationModal` → activar **Modo edición** |
| CU-194 | Canvas: trazos al arrastrar (`PhotoDrawingStroke`) |
| CU-195 | **Guardar anotación** → `savePhotoAnnotation` (metadatos en store) |
| CU-196 | **Deshacer** / **Limpiar trazos** |

**Ruta:** Órdenes → drawer detalle OT → `OrderPhotosPanel` → ícono lápiz por foto

## RF57 — Auditoría / bitácora

| CU | Elemento UI |
|----|-------------|
| CU-202 | `ReportsPage` tab **Auditoría** → `AuditReportPanel` título **Bitácora general** + tabla |
| CU-203 | Filtro **Usuario** (select) |
| CU-204 | Checkbox **Solo registros críticos con cambios** + columnas valor anterior/nuevo + drawer detalle |

**Ruta:** `/reportes?tab=auditoria`

## RF70 — Correo electrónico de usuario

| CU | Elemento UI |
|----|-------------|
| CU-238 | `UsersTable` → ícono correo → `UserEmailConsultModal` (consulta y estado de vinculación) |
| CU-239 | `LinkUserEmailModal` (desde consulta o flujo directo) → `linkUserEmail` |
| CU-240 | `UnlinkUserEmailModal` → confirmación → `unlinkUserEmail` |

**Nota:** En el documento oficial RF70 lista CU-239–241; CU-238 se implementa como consulta previa al flujo de vinculación, según alcance del prompt.

**Ruta:** `/usuarios`
