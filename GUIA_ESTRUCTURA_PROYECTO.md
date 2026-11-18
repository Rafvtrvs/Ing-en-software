# Guía Rápida de Estructura del Proyecto
## Sistema de Gestión - Alcantarillados Camus Ltda.

> **Documento para explicar la arquitectura y organización del sistema al Jefe de Carrera**

---

## Resumen Ejecutivo

Este sistema es una **aplicación web de gestión empresarial** desarrollada para la empresa Alcantarillados Camus Ltda. Permite administrar órdenes de trabajo, clientes, inventario, facturación y reportes operacionales.

**Tecnologías principales:**
- **Frontend:** React 19 + TypeScript + Vite
- **Backend:** Node.js + Express + TypeScript
- **Base de datos:** PostgreSQL
- **ORM:** Prisma

---

## Estructura General del Repositorio

```
ing-en-software/
├── README.md                    ← Instrucciones generales del proyecto
├── .gitignore                   ← Archivos ignorados por Git
└── camus LDA/                   ← Carpeta principal del sistema
    ├── src/                     ← Código fuente del FRONTEND
    ├── server/                  ← Código fuente del BACKEND (API)
    ├── public/                  ← Archivos públicos estáticos
    ├── base de datos/           ← Scripts SQL adicionales
    ├── docker-compose.yml       ← Configuración Docker (despliegue)
    ├── Dockerfile               ← Imagen Docker del frontend
    └── package.json             ← Dependencias del frontend
```

---

## 1. FRONTEND (`camus LDA/src/`)

El frontend es la **interfaz de usuario** - lo que ve y usa el usuario final en el navegador.

### Estructura del Frontend

```
src/
├── main.tsx                     ← Punto de entrada de la aplicación React
├── app/                         ← Configuración principal y rutas
├── components/                  ← Componentes reutilizables de UI
│   ├── auth/                    ← Componentes de autenticación (login)
│   ├── layout/                  ← Estructura visual (sidebar, header)
│   └── ui/                      ← Elementos de interfaz (botones, tablas, modales)
├── constants/                   ← Constantes y configuraciones
├── data/                        ← Datos de demostración (mock)
├── features/                    ← MÓDULOS FUNCIONALES (ver detalle abajo)
├── hooks/                       ← Hooks personalizados de React
├── lib/                         ← Librerías auxiliares
├── pages/                       ← Páginas compartidas
├── services/                    ← Cliente HTTP (Axios) para conectar con API
├── store/                       ← ESTADO GLOBAL de la aplicación (Zustand)
├── styles/                      ← Estilos CSS globales
├── types/                       ← Definiciones de tipos TypeScript
└── utils/                       ← Funciones utilitarias
```

### Módulos Funcionales (`src/features/`)

Cada carpeta representa un **módulo del sistema**:

| Carpeta | Descripción | Funcionalidad |
|---------|-------------|---------------|
| `auth/` | Autenticación | Login, logout, gestión de sesión |
| `dashboard/` | Panel principal | Vista resumen con métricas y gráficos |
| `clients/` | Gestión de Clientes | CRUD de clientes, búsqueda, filtros |
| `orders/` | Órdenes de Trabajo | Crear, editar, asignar OT, seguimiento |
| `inventory/` | Inventario | Stock de insumos, alertas, movimientos |
| `billing/` | Facturación | Facturas, pagos, estados de cuenta |
| `operations/` | Operaciones | Control operacional |
| `field/` | Terreno | Operaciones en campo |
| `reports/` | Reportes | Generación de informes y estadísticas |
| `users/` | Usuarios | Gestión de usuarios y roles |
| `settings/` | Configuración | Ajustes del sistema |
| `parameters/` | Parámetros | Configuración de parámetros del negocio |
| `support/` | Soporte | Mesa de ayuda |

### Estado Global (`src/store/`)

Archivos que manejan el **estado compartido** de la aplicación usando Zustand:

| Archivo | Propósito |
|---------|-----------|
| `useOrdersStore.ts` | Estado de órdenes de trabajo |
| `useClientsStore.ts` | Estado de clientes |
| `useInventoryStore.ts` | Estado de inventario |
| `useBillingStore.ts` | Estado de facturación |
| `useUsersStore.ts` | Estado de usuarios |
| `useEquipmentStore.ts` | Estado de maquinaria/equipos |
| `useSettingsStore.ts` | Configuraciones del sistema |
| `useNotificationsStore.ts` | Notificaciones push |
| `useAppStore.ts` | Estado general de la app |

---

## 2. BACKEND / API (`camus LDA/server/`)

El backend es el **servidor** que procesa las peticiones y conecta con la base de datos.

### Estructura del Backend

```
server/
├── src/
│   ├── index.ts                 ← Punto de entrada del servidor
│   ├── app.ts                   ← Configuración de Express
│   ├── router.ts                ← Definición de rutas/endpoints API
│   ├── config/                  ← Configuraciones (Firebase, etc.)
│   ├── controllers/             ← CONTROLADORES (reciben peticiones HTTP)
│   ├── services/                ← SERVICIOS (lógica de negocio)
│   ├── middleware/              ← Middlewares (autenticación, validación)
│   ├── db/                      ← Conexión a base de datos
│   ├── utils/                   ← Utilidades
│   └── external/                ← Integraciones externas
├── prisma/
│   ├── schema.prisma            ← ESQUEMA de la base de datos
│   ├── seed.ts                  ← Datos iniciales de demostración
│   └── migrations/              ← Migraciones de BD
├── Dockerfile                   ← Imagen Docker del backend
└── package.json                 ← Dependencias del backend
```

### Controladores (`server/src/controllers/`)

Reciben las peticiones HTTP y las delegan a los servicios:

| Controlador | Responsabilidad |
|-------------|-----------------|
| `auth.controller.ts` | Login, registro, tokens JWT |
| `order.controller.ts` | CRUD de órdenes de trabajo |
| `client.controller.ts` | CRUD de clientes |
| `asset.controller.ts` | Gestión de maquinaria |
| `invoice.controller.ts` | Facturación y pagos |
| `evidence.controller.ts` | Evidencias multimedia de OT |
| `document.controller.ts` | Documentos adjuntos |
| `estimate.controller.ts` | Estimaciones de costo |
| `modification.controller.ts` | Solicitudes de modificación OT |
| `reschedule.controller.ts` | Reprogramación de OT |
| `report.controller.ts` | Generación de reportes |
| `user.controller.ts` | Gestión de usuarios |
| `kit.controller.ts` | Kits de insumos |
| `stock-movement.controller.ts` | Movimientos de inventario |
| `intervention.controller.ts` | Intervenciones en OT |

### Servicios (`server/src/services/`)

Contienen la **lógica de negocio** principal:

| Servicio | Función |
|----------|---------|
| `auth.service.ts` | Autenticación, tokens, verificación |
| `order.service.ts` | Lógica de órdenes de trabajo |
| `client.service.ts` | Lógica de clientes |
| `machinery.service.ts` | Gestión de maquinaria |
| `invoice.service.ts` | Lógica de facturación |
| `evidence.service.ts` | Manejo de evidencias |
| `estimate.service.ts` | Cálculo de estimaciones |
| `modification.service.ts` | Flujo de modificaciones |
| `reschedule.service.ts` | Reprogramación |
| `audit.service.ts` | Bitácora de auditoría |
| `pushNotify.service.ts` | Notificaciones push |
| `user.service.ts` | Gestión de usuarios |
| `kit.service.ts` | Kits de insumos |
| `stock-movement.service.ts` | Control de stock |

---

## 3. BASE DE DATOS (`prisma/schema.prisma`)

Define todas las **tablas** del sistema. Principales entidades:

### Entidades Principales

| Modelo | Descripción | Campos clave |
|--------|-------------|--------------|
| `Usuario` | Usuarios del sistema | nombre, correo, rol, estado |
| `Rol` | Roles de usuario | nombre, permisos |
| `Permiso` | Permisos del sistema | clave, módulo |
| `Cliente` | Clientes de la empresa | rut, nombre, empresa, contacto |
| `OrdenTrabajo` | Órdenes de trabajo | id, estado, prioridad, servicio, operador |
| `Maquinaria` | Equipos y vehículos | patente, marca, estado, ubicación |
| `Insumo` | Materiales de inventario | código, stock, unidad, costo |
| `Proveedor` | Proveedores de insumos | nombre, rut, contacto |
| `Factura` | Facturas emitidas | número, monto, estado, cliente |
| `EvidenciaMultimedia` | Fotos/videos de OT | archivo, fecha, orden |
| `DocumentoOrden` | Documentos adjuntos | título, tipo, versión |
| `BitacoraAuditoria` | Registro de acciones | acción, usuario, fecha |

### Relaciones Importantes

- **Usuario** tiene un **Rol** con múltiples **Permisos**
- **Cliente** tiene muchas **OrdenTrabajo** y **Factura**
- **OrdenTrabajo** tiene **Evidencias**, **Documentos**, **Intervenciones**
- **Insumo** pertenece a **Proveedor** y **CategoríaInsumo**
- **MovimientoStock** registra entradas/salidas de **Insumo**

---

## 4. ARCHIVOS DE CONFIGURACIÓN

### Raíz del proyecto (`camus LDA/`)

| Archivo | Propósito |
|---------|-----------|
| `package.json` | Dependencias y scripts del frontend |
| `vite.config.ts` | Configuración del bundler Vite |
| `tsconfig.json` | Configuración de TypeScript |
| `eslint.config.js` | Reglas de linting (calidad de código) |
| `index.html` | HTML principal de la SPA |
| `docker-compose.yml` | Orquestación de contenedores |
| `Dockerfile` | Imagen Docker del frontend |
| `nginx.conf` | Configuración del servidor web |
| `firebase.json` | Configuración de Firebase Hosting |
| `.env.example` | Variables de entorno de ejemplo |

### Backend (`camus LDA/server/`)

| Archivo | Propósito |
|---------|-----------|
| `package.json` | Dependencias y scripts del backend |
| `tsconfig.json` | Configuración TypeScript del servidor |
| `Dockerfile` | Imagen Docker del backend |
| `.env.example` | Variables de entorno del servidor |

---

## 5. FLUJO DE DATOS

```
┌─────────────┐    HTTP/JSON    ┌─────────────┐    SQL/Prisma    ┌─────────────┐
│   FRONTEND  │ ◄─────────────► │   BACKEND   │ ◄──────────────► │  PostgreSQL │
│   (React)   │    API REST     │  (Express)  │                  │     (BD)    │
└─────────────┘                 └─────────────┘                  └─────────────┘
     │                               │
     │ Zustand (estado)              │ Prisma ORM
     │                               │
     ▼                               ▼
 Componentes                    Controladores
     │                               │
     ▼                               ▼
   Hooks                         Servicios
```

---

## 6. CÓMO EJECUTAR

### Desarrollo Local

**Terminal 1 - Backend:**
```bash
cd "camus LDA/server"
npm install
npm run prisma:generate
npm run prisma:push
npm run seed          # Cargar datos de demo
npm run dev           # Inicia en http://localhost:4000
```

**Terminal 2 - Frontend:**
```bash
cd "camus LDA"
npm install
npm run dev           # Inicia en http://localhost:5173
```

### Con Docker (Producción)
```bash
cd "camus LDA"
docker compose up --build
# App: http://localhost:3080
# API: http://localhost:4000/api
```

---

## 7. FASES DE DESARROLLO

| Fase | Estado | Descripción |
|------|--------|-------------|
| Base + Dashboard | ✅ Completado | Estructura base y panel principal |
| Clientes | ✅ Completado | CRUD completo de clientes |
| Órdenes de Trabajo | ✅ Completado | Gestión completa de OT |
| Inventario | ✅ Completado | Control de stock e insumos |
| Operaciones en Terreno | 🔄 En progreso | App móvil para operadores |
| Facturación | 🔄 En progreso | Sistema de cobros |
| Reportes | 🔄 En progreso | Generación de informes |

---

## 8. TECNOLOGÍAS UTILIZADAS

### Frontend
- **React 19** - Biblioteca de UI
- **TypeScript** - Tipado estático
- **Vite** - Bundler y dev server
- **Tailwind CSS** - Framework de estilos
- **Zustand** - Gestión de estado
- **React Router** - Navegación
- **Axios** - Cliente HTTP
- **Recharts** - Gráficos
- **Lucide React** - Iconos
- **Mapbox GL** - Mapas interactivos

### Backend
- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **TypeScript** - Tipado estático
- **Prisma** - ORM para PostgreSQL
- **JWT** - Autenticación por tokens
- **bcrypt** - Encriptación de contraseñas
- **Firebase Admin** - Notificaciones push

### Infraestructura
- **PostgreSQL** - Base de datos relacional
- **Docker** - Contenedorización
- **Firebase Hosting** - Hospedaje del frontend
- **Render/Railway** - Hospedaje del backend

---

## Contacto

**Grupo 21 - Ingeniería en Software**

> Este documento fue generado como guía explicativa de la estructura del proyecto para presentaciones académicas.
