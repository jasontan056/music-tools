#!/usr/bin/env bash
set -euo pipefail

echo "🏗️  Building local images..."
docker build -t skeleton-server:local -f apps/server/Dockerfile .
docker build -t skeleton-web:local -f apps/web/Dockerfile .

export SERVER_IMAGE="skeleton-server:local"
export WEB_IMAGE="skeleton-web:local"
export SKIP_PULL="true"
export COMPOSE_PROJECT_NAME="skeleton-local-preview"

echo "⚠️  Please stop any local dev servers (ports 4000/4173)"
bash scripts/deploy-tasks.sh

echo "App running at http://localhost:4173"
