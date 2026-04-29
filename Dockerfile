# Coolify icin emay panel Dockerfile.
# Multi-stage build: deps -> builder -> runner.
# Standalone output (next.config: output: 'standalone') kullanilir; runner
# imaji minimal (sadece gerekli node_modules).
# Container baslangicinda 'prisma migrate deploy' + idempotent seed otomatik calisir.

FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat openssl

# ----------------------------------------------------------
# 1) deps: package.json + prisma schema kullanip baglntilari kur
# ----------------------------------------------------------
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm ci

# ----------------------------------------------------------
# 2) builder: prisma generate + next build (standalone)
# ----------------------------------------------------------
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ----------------------------------------------------------
# 3) runner: minimal image - sadece standalone server + assets
# ----------------------------------------------------------
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Public dosyalar (static assets, uploads, legacy CSS/JS, video)
COPY --from=builder /app/public ./public

# Standalone server bundle (server.js + minimal node_modules)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Prisma schema + migrations (entrypoint migrate deploy icin gerekli)
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Prisma CLI + engine binary'leri (entrypoint'in 'prisma db push'/'migrate deploy' icin gerekli)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma

# Seed scripti icin gerekli paketler (tsx + bcrypt + zod + tslib)
COPY --from=builder /app/node_modules/tsx ./node_modules/tsx
COPY --from=builder /app/node_modules/bcrypt ./node_modules/bcrypt
COPY --from=builder /app/node_modules/dotenv ./node_modules/dotenv
COPY --from=builder /app/node_modules/.bin ./node_modules/.bin

# Entrypoint script
COPY --chown=nextjs:nodejs docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["./docker-entrypoint.sh"]
# Standalone server.js node ile direkt calistirilir
CMD ["node", "server.js"]
