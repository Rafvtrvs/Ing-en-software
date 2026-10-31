# API Camus — imagen de producción
FROM node:22-alpine AS build
WORKDIR /app
RUN apk add --no-cache openssl libc6-compat

COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm ci
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache openssl libc6-compat

COPY package.json package-lock.json* ./
COPY prisma ./prisma
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

EXPOSE 4000
# Evita .sh con CRLF de Windows ("no such file or directory")
CMD ["sh", "-c", "npx prisma db push --skip-generate && exec node dist/src/index.js"]
