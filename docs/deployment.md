# Deployment Guide (DigitalOcean droplet)

This repo ships Dockerized web + API apps plus a Traefik edge proxy. The GitHub Actions workflow builds and pushes images to GHCR and can SSH into a droplet to run the same `docker-compose.yml` used locally.

## Prerequisites on the droplet

- Ubuntu/Debian host with ports 80/443 open.
- Docker Engine and the Compose plugin:
  ```bash
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker "$USER" && newgrp docker
  ```
- A GHCR token with `read:packages` (use `GITHUB_TOKEN` or a PAT).
- DNS A/CNAME pointing to the droplet (e.g., `*.preview.example.com` and your production domain).

## One-time droplet bootstrap

```bash
# 1) Create a shared network for Traefik <-> app containers
docker network create web_proxy

# 2) Upload the proxy compose file and start Traefik
rsync -az docker-compose.proxy.yml user@your-droplet:~/infra/
COMPOSE_PROJECT_NAME=skeleton-proxy docker compose -f docker-compose.proxy.yml up -d traefik

# 3) Prepare a workspace for previews
mkdir -p /var/www/skeleton-previews
```

Traefik will expose HTTP on `:80` and its dashboard on `:8080`. It must stay running so app stacks can attach to `web_proxy`.

## Manual deploy (pulling images from GHCR)

```bash
# Authenticate to GHCR (replace values)
echo "$GHCR_PAT" | docker login ghcr.io -u YOUR_GH_USERNAME --password-stdin

# Pick your image tags (from CI output) and project slug
export SERVER_IMAGE=ghcr.io/<org>/<repo>-server:<tag>
export WEB_IMAGE=ghcr.io/<org>/<repo>-web:<tag>
export COMPOSE_PROJECT_NAME=<repo>-prod   # becomes <repo>-prod.preview.example.com (or your domain)
export HOST_DOMAIN=example.com            # base domain for router rules

# Optional: point to an external DB instead of the bundled Postgres
# export DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Copy compose + helper script to the server (if not already there)
rsync -az docker-compose.yml scripts/deploy-tasks.sh user@your-droplet:/var/www/skeleton-previews/${COMPOSE_PROJECT_NAME}/
cd /var/www/skeleton-previews/${COMPOSE_PROJECT_NAME}

# Launch (runs migrations/seed, then starts web+api+db)
bash deploy-tasks.sh
```

If you keep the bundled Postgres, data persists in the `pg-data` volume on the droplet.

## GitHub Actions preview deployments

The workflow `.github/workflows/ci.yml` builds images and, on pull requests, SSHes into the droplet to run `scripts/deploy-preview.sh`. Configure these repository secrets:

- `PREVIEW_SSH_HOST` – droplet IP or hostname.
- `PREVIEW_SSH_USER` – SSH user with Docker permissions.
- `PREVIEW_SSH_KEY` – base64-encoded private key for that user (e.g., `base64 -w 0 ~/.ssh/id_ed25519`).
- `REGISTRY_USER` / `REGISTRY_TOKEN` – registry creds to pull images on the droplet (GHCR: `${{ github.actor }}` + `${{ secrets.GITHUB_TOKEN }}` are set in the workflow).
- `PRODUCTION_SSH_HOST/USER/KEY` – same as preview, but for prod (used by the `production-deploy` job).
- `PRODUCTION_HOST_DOMAIN` – base domain for production host rules (e.g., `example.com`).

Make sure the droplet has:

- GHCR access (`docker login ghcr.io` already performed or configure on first run).
- The `web_proxy` network and Traefik running (`COMPOSE_PROJECT_NAME=skeleton-proxy docker compose -f docker-compose.proxy.yml up -d traefik`).
- The target base directory `/var/www/skeleton-previews` writable by the SSH user.

Each branch gets its own compose project name derived as `<repo>-<branch>` (slashes => dashes, lowercased), so URLs look like `https://<repo>-<branch>.preview.example.com`. Point your wildcard DNS at the droplet to make those hosts resolve.

## Production deploys (main branch)

- GitHub Actions now runs `production-deploy` on `main`, SSHing into the droplet with `PRODUCTION_SSH_*` secrets. It logs into GHCR, sets `COMPOSE_PROJECT_NAME=<repo>-prod`, and runs `scripts/deploy-prod.sh`, which in turn runs `deploy-tasks.sh` with `DB_COMMAND=db:migrate` and `RUN_SEED=false`.
- Set `PRODUCTION_HOST_DOMAIN` so Traefik host rules resolve to your real domain (compose uses `${HOST_DOMAIN:-lvh.me}`).
- If you prefer an external/Postgres service, set `DATABASE_URL` on the droplet before running the script.

## Cleanup (previews)

Previews create per-project networks, containers, and Postgres volumes. Prune old previews periodically (e.g., PR closed) with:

```bash
docker compose -p <project> down -v
docker volume prune -f  # optional, broader cleanup
```

GitHub Actions includes a `preview-cleanup` job that fires on PR close and runs `scripts/cleanup-preview.sh` over SSH to tear down the composed stack and remove its directory.
