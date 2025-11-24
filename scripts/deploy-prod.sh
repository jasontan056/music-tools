#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${PRODUCTION_SSH_HOST:-}" || -z "${PRODUCTION_SSH_USER:-}" || -z "${PRODUCTION_SSH_KEY:-}" ]]; then
  echo "Missing production deploy secrets" >&2
  exit 0
fi

if [[ -z "${SERVER_IMAGE:-}" || -z "${WEB_IMAGE:-}" ]]; then
  echo "Missing Docker image references" >&2
  exit 1
fi

BRANCH="${GITHUB_REF##*/}"
REPO_SLUG=$(echo "${GITHUB_REPOSITORY:-skeleton}" | tr '[:upper:]' '[:lower:]' | tr '/' '-')
PRODUCTION_SLUG="${PRODUCTION_SLUG:-${REPO_SLUG}-prod}"
REMOTE_DIR="~/deployments/skeleton-prod/${PRODUCTION_SLUG}"

echo "Deploying production ${PRODUCTION_SLUG}..."

echo "$PRODUCTION_SSH_KEY" > temp_key
chmod 600 temp_key
SSH_CMD="ssh -i temp_key -o StrictHostKeyChecking=no"

$SSH_CMD ${PRODUCTION_SSH_USER}@${PRODUCTION_SSH_HOST} "mkdir -p ${REMOTE_DIR}"

rsync -e "$SSH_CMD" -az --delete \
  docker-compose.yml \
  scripts/deploy-tasks.sh \
  ${PRODUCTION_SSH_USER}@${PRODUCTION_SSH_HOST}:${REMOTE_DIR}

$SSH_CMD ${PRODUCTION_SSH_USER}@${PRODUCTION_SSH_HOST} <<SCRIPT
set -euo pipefail
cd ${REMOTE_DIR}
export REGISTRY_USER="${REGISTRY_USER}"
export REGISTRY_TOKEN="${REGISTRY_TOKEN}"
if [[ -n "\${REGISTRY_USER:-}" && -n "\${REGISTRY_TOKEN:-}" ]]; then
  echo "\$REGISTRY_TOKEN" | docker login ghcr.io -u "\$REGISTRY_USER" --password-stdin
fi
export SERVER_IMAGE="${SERVER_IMAGE}"
export WEB_IMAGE="${WEB_IMAGE}"
export COMPOSE_PROJECT_NAME="${PRODUCTION_SLUG}"
export DB_COMMAND="\${DB_COMMAND:-db:migrate}"
export RUN_SEED="\${RUN_SEED:-false}"
export HOST_DOMAIN="\${HOST_DOMAIN:-${PRODUCTION_HOST_DOMAIN:-}}"
if [[ -n "\${HOST_DOMAIN}" ]]; then
  export WEB_URL="https://\${COMPOSE_PROJECT_NAME}.\${HOST_DOMAIN}"
fi
bash deploy-tasks.sh
SCRIPT

rm -f temp_key

echo "Production deploy complete for ${PRODUCTION_SLUG}"
