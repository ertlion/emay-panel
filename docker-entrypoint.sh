#!/bin/sh
# Coolify deployment entrypoint.
# 1. DB schema'yi prod DB'ye uygula (migrate deploy varsa, yoksa db push)
# 2. Default admin + statik veri seed (idempotent - upsert kullanir)
# 3. Next.js standalone server'i baslat
set -e

# DATABASE_URL kontrolu
if [ -z "$DATABASE_URL" ]; then
  echo "!! DATABASE_URL env yok - Coolify'da Postgres baglanti URL'sini set edin"
  exit 1
fi

# Migration'lar varsa migrate deploy, yoksa schema'yi direkt push et (ilk deploy)
if [ -d "prisma/migrations" ] && [ "$(ls -A prisma/migrations 2>/dev/null)" ]; then
  echo "==> Running Prisma migrations (migrate deploy)..."
  npx prisma migrate deploy
else
  echo "==> No migrations folder - using prisma db push for initial schema..."
  npx prisma db push --skip-generate --accept-data-loss
fi

# Seed sadece bos DB icin (ilk deploy). Idempotent oldugu icin tekrar calisirsa
# upsert ile mevcut veriyi gunceller - sorun degil.
if [ "${RUN_SEED:-true}" = "true" ]; then
  echo "==> Running database seed (idempotent)..."
  npx tsx prisma/seed.ts || echo "!! Seed skipped or failed (non-fatal): $?"
fi

echo "==> Starting Next.js standalone server..."
exec "$@"
