# Alcantarillados Camus Ltda. — Sistema de Gestión

Frontend SaaS para gestión de operaciones, clientes, órdenes, inventario, facturación y reportes.

## Stack

- React 19 + Vite 6 + TypeScript
- Tailwind CSS 4
- React Router DOM 7
- Zustand · Axios · Recharts · React Hook Form · Lucide React

## Inicio rápido

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
