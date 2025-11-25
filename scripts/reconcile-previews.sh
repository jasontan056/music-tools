#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${SSH_HOST:-}" || -z "${SSH_USER:-}" || -z "${SSH_KEY:-}" ]]; then
  echo "Missing preview cleanup secrets" >&2
  exit 1
fi

if [[ -z "${REPO_SLUG:-}" ]]; then
  echo "Missing REPO_SLUG" >&2
  exit 1
fi

# ALLOWED_BRANCH_SLUGS should be a space-separated string of valid branch slugs
# e.g. "feature-a bugfix-b"
ALLOWED_BRANCH_SLUGS="${ALLOWED_BRANCH_SLUGS:-}"

echo "Starting preview reconciliation for repo: ${REPO_SLUG}"
echo "Allowed branch slugs: ${ALLOWED_BRANCH_SLUGS}"

echo "$SSH_KEY" > temp_key
chmod 600 temp_key
SSH_CMD="ssh -i temp_key -o StrictHostKeyChecking=no"

$SSH_CMD ${SSH_USER}@${SSH_HOST} "bash -s" <<REMOTE_SCRIPT
set -euo pipefail

# Target the repo-specific directory
REPO_ROOT=~/deployments/skeleton-previews/${REPO_SLUG}

if [ ! -d "\$REPO_ROOT" ]; then
  echo "No deployments found for ${REPO_SLUG}"
  exit 0
fi

cd "\$REPO_ROOT"

ALLOWED="${ALLOWED_BRANCH_SLUGS}"

# List all directories (branches) in the repo root
for dir in */; do
  dir=\${dir%/}
  
  if [[ ! -d "\$dir" ]]; then
    continue
  fi

  # Check if this branch directory is in the allowed list
  if [[ " \$ALLOWED " == *" \$dir "* ]]; then
    echo "KEEP: \$dir"
  else
    echo "DELETE: \$dir (not in allowed list)"
    cd "\$dir"
    
    # Reconstruct the project name used in deploy-preview.sh
    # PREVIEW_SLUG="\${REPO_SLUG}-\${BRANCH_SLUG}"
    PROJECT_NAME="${REPO_SLUG}-\${dir}"
    
    if docker compose ls -q | grep -q "^\${PROJECT_NAME}\$"; then
       docker compose -p "\$PROJECT_NAME" down -v --rmi all || true
    elif [ -f "docker-compose.yml" ]; then
       docker compose -p "\$PROJECT_NAME" down -v --rmi all || true
    fi
    
    cd ..
    rm -rf "\$dir"
  fi
done
REMOTE_SCRIPT

rm temp_key
echo "Reconciliation complete."
