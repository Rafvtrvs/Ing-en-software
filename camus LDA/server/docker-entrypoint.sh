#!/bin/sh
set -e

echo "[api] aplicando esquema Prisma (db push)..."
npx prisma db push --skip-generate

echo "[api] iniciando servidor..."
exec node dist/src/index.js
