# Backend — Alcantarillados Camus Ltda.

Capa **Controladores** del diagrama de despliegue: Servidor HTTPS (Node.js + TypeScript),
enrutador de servidor, middleware de autenticación, controllers, services, conexión BD
(Prisma + PostgreSQL) y servicios externos (simulados).

## Arquitectura (según el diagrama)

```
Vista (React) ──HTTPS/JSON + JWT──► Servidor HTTPS (Express)
                                     └─ Enrutador (router.ts)
                                        └─ Middleware (auth JWT)
                                           └─ Controllers
                                              └─ Services (lógica de negocio)
                                                 ├─ Conexión BD (Prisma) ─► PostgreSQL
                                                 └─ Servicios externos (SIMULADOS):
                                                    Storage / Correo / Push
```

| Componente del diagrama | Implementación |
|---|---|
| Servidor HTTPS (Node + TS) | `src/index.ts`, `src/app.ts` |
| Enrutador | `src/router.ts` |
| Middleware (Firebase Auth + HTTPS) | `src/middleware/auth.ts` |
| AuthController | `src/controllers/auth.controller.ts` |
| ClientController / OrderController / AssetController / ReportController | `src/controllers/*.ts` |
| ClientService / OrderService / AssetService / ReportService | `src/services/*.ts` |
| Conexión BD (Prisma ORM) | `src/db/prisma.ts`, `prisma/schema.prisma` |
| Registro y auditoría | `src/services/audit.service.ts` |
| Cloud SQL PostgreSQL | PostgreSQL (real, local) |
| Firebase Storage | `src/external/storage.service.ts` (**SIMULADO**) |
| Servicio de correo (Mailgun/SendGrid) | `src/external/mail.service.ts` (**SIMULADO**) |
| Push (FCM) | `src/external/push.service.ts` (**SIMULADO**) |

## Requisitos

- Node.js 18+
- PostgreSQL local (o Docker)

## Puesta en marcha

```bash
cd "camus LDA/server"
cp .env.example .env          # ajusta DATABASE_URL si es necesario
npm install
npm run prisma:generate
npm run prisma:push           # crea las tablas en PostgreSQL
npm run seed                  # carga datos de demostración
npm run dev                   # servidor en http://localhost:4000/api
```

PostgreSQL rápido con Docker (opcional):

```bash
docker run --name camus-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=camus_lda -p 5432:5432 -d postgres:16
```

## Credenciales de prueba

- Usuario: `admin@camus.cl`
- Clave: `admin123`

## Servicios externos pagados (modo simulado)

`STORAGE_PROVIDER`, `MAIL_PROVIDER` y `PUSH_PROVIDER` están en `mock`. No realizan
llamadas reales ni requieren cuentas de pago. Cada mock implementa la misma interfaz
que el proveedor real, por lo que migrar a Firebase Storage / SendGrid / FCM solo
implica añadir la implementación real y cambiar la variable de entorno.

## Endpoints

| Método | Ruta | Auth |
|---|---|---|
| POST | `/api/auth/login` | público |
| GET | `/api/auth/me` | JWT |
| GET/POST/PUT/DELETE | `/api/clients` | lectura pública / escritura JWT |
| GET/POST/PUT/DELETE | `/api/orders` | lectura pública / escritura JWT |
| GET/POST/PUT/DELETE | `/api/assets` | lectura pública / escritura JWT |
| GET | `/api/reports/summary` | público |
| GET | `/api/reports/audit` | JWT |
