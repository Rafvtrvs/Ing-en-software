# Alcantarillados Camus Ltda. — Sistema de Gestión

Frontend SaaS para gestión de operaciones, clientes, órdenes, inventario, facturación y reportes.

## Stack

- React 19 + Vite 6 + TypeScript
- Tailwind CSS 4
- React Router DOM 7
- Zustand · Axios · Recharts · React Hook Form · Lucide React

## Inicio rápido
IMPORTANTE: ejecutar npx prisma db push en /server para agregar las tablas nuevas
```bash
npm install
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173).

## Scripts

| Comando        | Descripción              |
|----------------|--------------------------|
| `npm run dev`  | Servidor de desarrollo   |
| `npm run build`| Build de producción      |
| `npm run preview` | Vista previa del build |

## Listo para nube (checklist)

1. **Build** — `npm run build` (raíz) y `npm run build` en `server/` deben pasar.
2. **Variables** — en local usá `.env` / `server/.env`. Para publicar, copiá los ejemplos:
   - Frontend: [`.env.production.example`](./.env.production.example) → `VITE_API_URL`, `VITE_MAPBOX_TOKEN` (antes del `build`).
   - API: [`server/.env.production.example`](./server/.env.production.example) → `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`.
3. **Datos** — viven en Postgres vía la API; el `dist/` del front no incluye las OT.
4. **Empaquetado (Docker)** — un comando levanta Postgres + API + front:

```bash
docker compose up --build
```

- App: [http://localhost:3080](http://localhost:3080)
- API: [http://localhost:4000/api](http://localhost:4000/api)

Seed opcional (usuarios demo) con el contenedor de la API ya arriba:

```bash
docker compose exec api npx tsx prisma/seed.ts
```

En la nube: mismo `docker compose` (o las mismas imágenes) cambiando `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN` y el `VITE_API_URL` del build del front.

### Deploy híbrido (Render/Railway + Firebase)

Guía paso a paso: [`docs/DEPLOY-HIBRIDO.md`](./docs/DEPLOY-HIBRIDO.md)

- **Render** (si Railway no deja registrarse): API + PostgreSQL  
- **Firebase Hosting:** frontend (`dist/`)

## Estructura

```
src/
├── app/           # App y router
├── components/    # UI y layout reutilizables
├── constants/     # Rutas y navegación
├── data/mock/     # Datos de demostración
├── features/      # Módulos por dominio
├── pages/         # Páginas compartidas
├── services/      # Cliente Axios
├── store/         # Estado global (Zustand)
├── styles/        # Estilos globales
├── types/         # Tipos TypeScript
└── utils/         # Utilidades
```

## Fases de desarrollo

- [x] Base + Dashboard
- [x] Clientes
- [x] Órdenes de Trabajo
- [x] Inventario
- [ ] Operaciones en Terreno
- [ ] Facturación
- [ ] Reportes
