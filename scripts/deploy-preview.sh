#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${SSH_HOST:-}" || -z "${SSH_USER:-}" || -z "${SSH_KEY:-}" ]]; then
  echo "Missing preview deploy secrets" >&2
  exit 0
fi

if [[ -z "${SERVER_IMAGE:-}" || -z "${WEB_IMAGE:-}" ]]; then
  echo "Missing Docker image references" >&2
  exit 1
fi

BRANCH="${GITHUB_HEAD_REF:-${GITHUB_REF##*/}}"
BRANCH_SLUG=$(echo "$BRANCH" | tr '[:upper:]' '[:lower:]' | tr '/' '-')
REPO_SLUG=$(echo "${GITHUB_REPOSITORY:-skeleton}" | tr '[:upper:]' '[:lower:]' | tr '/' '-')
PREVIEW_SLUG="${REPO_SLUG}-${BRANCH_SLUG}"
REMOTE_DIR="/var/www/skeleton-previews/${PREVIEW_SLUG}"

echo "Creating preview ${PREVIEW_SLUG}..."

echo "$SSH_KEY" > temp_key
chmod 600 temp_key
SSH_CMD="ssh -i temp_key -o StrictHostKeyChecking=no"

$SSH_CMD ${SSH_USER}@${SSH_HOST} "mkdir -p ${REMOTE_DIR}"

rsync -e "$SSH_CMD" -az --delete \
  docker-compose.yml \
  scripts/deploy-tasks.sh \
  ${SSH_USER}@${SSH_HOST}:${REMOTE_DIR}

$SSH_CMD ${SSH_USER}@${SSH_HOST} <<SCRIPT
set -euo pipefail
cd ${REMOTE_DIR}
if [[ -n "\${REGISTRY_USER:-}" && -n "\${REGISTRY_TOKEN:-}" ]]; then
  echo "\$REGISTRY_TOKEN" | docker login ghcr.io -u "\$REGISTRY_USER" --password-stdin
fi
export SERVER_IMAGE="${SERVER_IMAGE}"
export WEB_IMAGE="${WEB_IMAGE}"
export COMPOSE_PROJECT_NAME="${PREVIEW_SLUG}"
bash deploy-tasks.sh
SCRIPT

rm -f temp_key

if [[ -n "${HOST_DOMAIN:-}" ]]; then
  echo "Preview ready at https://${PREVIEW_SLUG}.${HOST_DOMAIN}"
else
  echo "Preview ready at http://${PREVIEW_SLUG}.lvh.me"
fi
