# ⚠️ Backend legado (ARCHIVADO)

Esta carpeta (antes `Ing-en-software`) contiene el **prototipo anterior** del
sistema y se conserva **solo como referencia de contraste**. No forma parte de
la arquitectura definida en el diagrama de despliegue.

## Por qué está archivado

| Aspecto | Prototipo legado | Arquitectura actual (diagrama) |
|---|---|---|
| Backend | Python + FastAPI (`main.py`) | Node.js + TypeScript (`/server`) |
| Base de datos | SQLite (`clientes.db`) | PostgreSQL + Prisma |
| Cobertura | Solo clientes y visitas | Todos los módulos |
| Vista | `index.html` (JS vanilla) | React + Vite (`/src`) |

## Backend vigente

El backend que respeta el diagrama está en **`../server`**.
No ejecutar este prototipo en paralelo: usa otro stack y otra base de datos.
