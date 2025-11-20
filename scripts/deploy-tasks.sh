#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${SERVER_IMAGE:-}" || -z "${WEB_IMAGE:-}" ]]; then
  echo "Error: SERVER_IMAGE and WEB_IMAGE must be set."
  exit 1
fi

echo "🚀 Deploying ${SERVER_IMAGE}..."

# 1. Pull images (skip if local)
if [[ "${SKIP_PULL:-false}" != "true" ]]; then
  docker compose pull -q
fi

# 2. Start Database
docker compose up -d db
sleep 5

# 3. Run Migrations & Seed
# Uses the tools inside the server image to talk to the db container
PROJECT_NAME="${COMPOSE_PROJECT_NAME:-$(basename "$PWD" | tr '[:upper:]' '[:lower:]')}"
NETWORK="${PROJECT_NAME}_default"

echo "🛠️  Migrating..."
docker run --rm --network "$NETWORK" \
  -e DATABASE_URL="postgresql://postgres:postgres@db:5432/skeleton" \
  "$SERVER_IMAGE" \
  pnpm --filter @acme/db db:push

echo "🌱 Seeding..."
docker run --rm --network "$NETWORK" \
  -e DATABASE_URL="postgresql://postgres:postgres@db:5432/skeleton" \
  "$SERVER_IMAGE" \
  pnpm --filter @acme/db db:seed

# 4. Launch
docker compose up -d
echo "✅ Done!"
