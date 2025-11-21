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
- DNS A/CNAME pointing to the droplet (e.g., `*.preview.example.com` or your production domain).

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
export COMPOSE_PROJECT_NAME=skeleton-prod   # becomes skeleton-prod.lvh.me / your domain

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

Make sure the droplet has:

- GHCR access (`docker login ghcr.io` already performed or configure on first run).
- The `web_proxy` network and Traefik running (`COMPOSE_PROJECT_NAME=skeleton-proxy docker compose -f docker-compose.proxy.yml up -d traefik`).
- The target base directory `/var/www/skeleton-previews` writable by the SSH user.

Each branch gets its own compose project name derived from the branch (slashes => dashes), so URLs look like `https://<branch>.preview.example.com`. Point your wildcard DNS at the droplet to make those hosts resolve.
