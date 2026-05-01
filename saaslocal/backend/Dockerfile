# ── Backend Dockerfile ──────────────────────────────────────
# Imagen base ligera de Node.js 20 LTS
FROM node:20-alpine AS base
WORKDIR /app

# Instalar dependencias del sistema necesarias para bcrypt
RUN apk add --no-cache python3 make g++

# ── Etapa de dependencias ────────────────────────────────────
FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production

# ── Imagen final ─────────────────────────────────────────────
FROM base AS runner
ENV NODE_ENV=production

# Crear usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Crear directorio de logs con permisos correctos
RUN mkdir -p logs && chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:4000/health || exit 1

CMD ["node", "src/index.js"]
