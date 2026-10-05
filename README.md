# Ing-en-software — Grupo 21

> **La documentación del proyecto (diagramas, documentos, presentaciones, etc.) fue movida a Google Drive.**  
> Este repositorio **solo contiene el código del sistema** en la carpeta `camus LDA`.

---

## Sistema: Alcantarillados Camus Ltda.

Aplicación de gestión (frontend React + backend Node.js/Express + PostgreSQL) para operaciones, clientes, órdenes, inventario, facturación y reportes.

### Requisitos

- Node.js 18 o superior
- PostgreSQL (local o Docker)
- npm

---

## Cómo ejecutarlo en tu computador

### 1. Backend (API)

Abre una terminal en la carpeta del servidor:

```bash
cd "camus LDA/server"
```

Copia el archivo de entorno y ajústalo si es necesario:

```bash
cp .env.example .env
```

En Windows (PowerShell):

```powershell
Copy-Item .env.example .env
```

Instala dependencias, crea las tablas y carga datos de demostración:

```bash
npm install
npm run prisma:generate
npm run prisma:push
npm run seed
npm run dev
```

El backend queda en [http://localhost:4000/api](http://localhost:4000/api).

**PostgreSQL rápido con Docker (opcional):**

```bash
docker run --name camus-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=camus_lda -p 5432:5432 -d postgres:16
```

### 2. Frontend (interfaz)

Abre **otra** terminal en la carpeta del frontend:

```bash
cd "camus LDA"
```

Copia el archivo de entorno (si aún no existe):

```bash
cp .env.example .env
```

En Windows (PowerShell):

```powershell
Copy-Item .env.example .env
```

Instala e inicia el servidor de desarrollo:

```bash
npm install
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173).

---

## Estructura del repositorio

```
.
├── README.md          ← este archivo
└── camus LDA/         ← sistema completo (frontend + backend)
    ├── src/           ← frontend React + Vite
    └── server/        ← backend Express + Prisma + PostgreSQL
```


