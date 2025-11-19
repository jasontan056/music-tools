#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${SSH_HOST:-}" || -z "${SSH_USER:-}" || -z "${SSH_KEY:-}" ]]; then
  echo "Missing preview deploy secrets" >&2
  exit 0
fi

BRANCH="${GITHUB_HEAD_REF:-${GITHUB_REF##*/}}"
PREVIEW_SLUG=$(echo "$BRANCH" | tr '/' '-')
REMOTE_DIR="/var/www/skeleton-previews/${PREVIEW_SLUG}"

echo "Creating preview ${PREVIEW_SLUG}..."

echo "$SSH_KEY" | base64 --decode > temp_key
chmod 600 temp_key

ssh -i temp_key -o StrictHostKeyChecking=no ${SSH_USER}@${SSH_HOST} \
  "mkdir -p ${REMOTE_DIR} && cd ${REMOTE_DIR} && docker compose down --remove-orphans || true"

rsync -e "ssh -i temp_key -o StrictHostKeyChecking=no" -az --delete ./ ${SSH_USER}@${SSH_HOST}:${REMOTE_DIR}

ssh -i temp_key -o StrictHostKeyChecking=no ${SSH_USER}@${SSH_HOST} <<SCRIPT
set -euo pipefail
cd ${REMOTE_DIR}
pnpm install --no-frozen-lockfile
pnpm --filter @acme/db db:push
pnpm --filter @acme/db db:seed
pnpm build
docker compose up -d --build
SCRIPT

rm temp_key

echo "Preview ready at https://${PREVIEW_SLUG}.preview.example.com"
