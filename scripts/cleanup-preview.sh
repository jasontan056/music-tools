#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${SSH_HOST:-}" || -z "${SSH_USER:-}" || -z "${SSH_KEY:-}" ]]; then
  echo "Missing preview cleanup secrets" >&2
  exit 0
fi

BRANCH="${GITHUB_HEAD_REF:-${GITHUB_REF##*/}}"
BRANCH_SLUG=$(echo "$BRANCH" | tr '[:upper:]' '[:lower:]' | tr '/' '-')
REPO_SLUG=$(echo "${GITHUB_REPOSITORY:-skeleton}" | tr '[:upper:]' '[:lower:]' | tr '/' '-')
PREVIEW_SLUG="${REPO_SLUG}-${BRANCH_SLUG}"
REMOTE_DIR="~/deployments/skeleton-previews/${PREVIEW_SLUG}"

echo "$SSH_KEY" > temp_key
chmod 600 temp_key
SSH_CMD="ssh -i temp_key -o StrictHostKeyChecking=no"

$SSH_CMD ${SSH_USER}@${SSH_HOST} <<SCRIPT
set -euo pipefail
if [ -d "${REMOTE_DIR}" ]; then
  cd "${REMOTE_DIR}"
  docker compose -p "${PREVIEW_SLUG}" down -v || true
  cd ~/deployments/skeleton-previews
  rm -rf "${PREVIEW_SLUG}"
  echo "Cleaned preview ${PREVIEW_SLUG}"
else
  echo "Preview ${PREVIEW_SLUG} not found, nothing to clean"
fi
SCRIPT

rm temp_key
