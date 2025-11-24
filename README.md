# Skeleton3 Monorepo

Modern full-stack starter that ships with a typed React + Mantine frontend, an Express + tRPC API, and a PostgreSQL database powered by Prisma. The repository demonstrates how to structure a pnpm/Turborepo mono workspace, share code between packages, and automate preview + production deployments with Docker and GitHub Actions. The guide below is formatted so another agent (or future you) can skim, copy/paste, and get productive in seconds.

## TL;DR Checklist

| Task | Command / Location |
| --- | --- |
| Install deps | `pnpm install` |
| Start Postgres | `./scripts/db-up.sh` |
| Generate Prisma client | `pnpm db:generate` |
| Push schema & seed | see [Database bootstrap](#database-bootstrap) |
| Run everything | `pnpm dev` (web on 5173, server on 4000) |
| Type-check | `pnpm lint` |
| Build | `pnpm build` |
| Deploy preview | GitHub Actions ➜ `scripts/deploy-preview.sh` |

## Tech Stack

- **Frontend:** Vite, React, TypeScript, Mantine UI, @tanstack/react-query, @trpc/react-query
- **Backend:** Node.js, Express, tRPC
- **Database:** PostgreSQL + Prisma
- **Tooling:** pnpm workspaces, Turborepo, Docker, GitHub Actions

## Repository Layout

```
apps/
  web/        # React client bootstrapped with Vite + Mantine
  server/     # Express server exposing the tRPC API
packages/
  api/        # Shared tRPC router definitions
  common/     # Types + utilities consumed throughout the monorepo
  db/         # Prisma schema, client, and seed helpers
  tooling-tests/ # CI-style checks for deploy scripts, Dockerfiles, and Turbo config
scripts/
  deploy-preview.sh # Example remote deploy helper triggered by CI
```

Shared TypeScript configuration lives in `tsconfig.base.json`, while `pnpm-workspace.yaml` and `turbo.json` orchestrate installs and tasks across the workspace. Each package declares its own scripts, but everything can be driven from the repo root via Turborepo.

## Requirements

- Node.js 20+
- pnpm (Corepack enabled is easiest)
- Docker (for local Postgres and production images)

## Getting Started

1. **Setup the environment**

   This command installs dependencies, starts the local database (via Docker), and seeds it with demo data.

   ```bash
   pnpm setup
   ```

2. **Run the apps**

   Start the web and server in parallel (web on `5173`, API on `4000`):

   ```bash
   pnpm dev
   ```

Visit http://localhost:5173, sign in with `demo@example.com` / `demo1234`, and explore the authenticated todo dashboard powered by tRPC.

## Database bootstrap

- Start Postgres: `./scripts/db-up.sh` (uses `docker-compose.dev.yml` to expose 5432 locally without changing production/CI compose).
- Generate client: `pnpm db:generate`.
- Quick dev sync: `pnpm --filter @acme/db db:push` then `pnpm --filter @acme/db db:seed`.
- Create migrations (recommended for shared/stage/prod): `pnpm --filter @acme/db prisma migrate dev --name init` (or a descriptive name). This writes files to `packages/db/prisma/migrations/**`; commit them.
- Deploy with migrations: `pnpm db:migrate` (or set `DB_COMMAND=db:migrate` when using `scripts/deploy-tasks.sh`). Seed with `pnpm --filter @acme/db db:seed` if you want demo data in that environment.

## Common Commands

- `pnpm dev` – runs `apps/web` and `apps/server` concurrently via `turbo dev`
- `pnpm build` – type-checks and builds every workspace target
- `pnpm lint` – type-checks only
- `pnpm db:generate|db:migrate|db:seed` – Prisma helpers

Each package/app also exposes its own scoped scripts (e.g. `pnpm --filter @acme/server dev`).

## Testing

- `pnpm test` – runs every workspace suite in parallel via Turborepo
- `pnpm --filter @acme/common test` – unit tests shared utilities (date helpers, constants)
- `pnpm --filter @acme/api test` – exercises both auth and todo routers with mocked Prisma/Bcrypt/Nanoid to keep the critical flows honest
- `pnpm --filter @acme/web test` – renders Mantine-based UI components (AuthPanel, TodoList, App shell) with Testing Library + jsdom to ensure the responsive dashboard behaves with real data (form validation, date picker, logout flow)
- `pnpm --filter @acme/server test` – supertest smoke tests plus a Testcontainers-backed integration suite that boots a disposable Postgres instance and drives register ➜ login ➜ create todo over both the Prisma context caller and the real Express+tRPC HTTP adapter
- `pnpm --filter @acme/db test` – guards the Prisma singleton and now runs the seeding script end-to-end in Postgres, guaranteeing demo data stays fresh
- `pnpm --filter @acme/tooling-tests test` – hermetic assertions for `scripts/deploy-preview.sh`, Dockerfiles, and `turbo.json` so deployment plumbing regresses less often

All suites run under Vitest. The API + DB integration tests rely on Docker (via Testcontainers) to launch ephemeral Postgres databases—ensure the Docker daemon is running locally or in CI before invoking them.

## Application Features

- **Credential-based auth** – Full sign-up/sign-in/logout flow with hashed passwords, session tokens, and `/auth/me` checks wired through tRPC.
- **Session-aware backend** – Express context inspects `Authorization: Bearer <token>` headers, fetches Prisma sessions, and enforces ownership on all todo operations.
- **Rich todo management** – Todos support statuses (Backlog, In Progress, Done), priorities, optional due dates, and are filterable/searchable. Stats cards highlight completion progress for quick triage.
- **Demo-friendly** – Seeding creates a ready-to-use account (`demo@example.com` / `demo1234`) plus a few illustrative todos so you can show off the experience immediately.
- **Responsive, modern UI** – Custom Mantine theme (Inter font, gradients, elevated cards) keeps the dashboard polished on mobile and desktop. Auth, stats, filters, and todos adapt to available space without extra configuration.

## Environment Reference

| Variable | Location | Description |
| --- | --- | --- |
| `DATABASE_URL` | `.env`, `packages/db/.env`, CI secrets | Postgres connection string |
| `WEB_URL` | `.env` | Where the server should allow CORS from (default `http://localhost:5173`) |
| `PORT` | `.env` | API listening port (default `4000`) |
| `AUTH_TOKEN_KEY` | `packages/common` | Frontend storage key for the session token (defaults to `skeleton3.session`) |

Session tokens are generated server-side and returned by the auth routers. The React client stores tokens in `localStorage` and automatically injects them into `Authorization` headers for every tRPC call.

## Deployment Workflow

- **Preview Deployments:** GitHub Actions (`.github/workflows/ci.yml`) builds the repo and runs `scripts/deploy-preview.sh`, which syncs artifacts to a remote host, runs migrations + seed, and boots Dockerized services. Each branch receives a self-contained database and subdomain.
- **Production:** Mirror the preview workflow but point secrets to the production environment. The first deployment provisions the DB; subsequent deploys run migrations only, preserving data.
- **Docker:** `apps/server/Dockerfile` and `apps/web/Dockerfile` build production images. Use them directly or via `docker compose` alongside the Postgres service defined at the repo root.

## Traefik & Routing

- Start Traefik locally with `docker compose -f docker-compose.proxy.yml up -d traefik`; it creates the shared `web_proxy` network and exposes HTTP on `:80` plus the dashboard on `:8080`.
- The main stack (`docker compose up`) attaches `web` and `server` to `web_proxy` and advertises routes via labels. The web UI routes on `Host(<project>.lvh.me)`; the API router matches the same host with `PathPrefix(/trpc, /healthz)` and forwards to port `4000`.
- `COMPOSE_PROJECT_NAME` builds the hostname (e.g., `feature-login.lvh.me`); `lvh.me` resolves to `127.0.0.1` for any subdomain, so multiple preview stacks can coexist without entries in `/etc/hosts`.
- The server’s `WEB_URL` env var uses the same host so CORS aligns with Traefik (`http://${COMPOSE_PROJECT_NAME}.lvh.me` by default).

### Local preview via lvh.me

- Start the proxy (reusable): `COMPOSE_PROJECT_NAME=skeleton-local-preview docker compose -f docker-compose.proxy.yml up -d traefik`
- Build + launch the stack: `./scripts/test-preview-local.sh` (exports the same `COMPOSE_PROJECT_NAME` and runs migrations/seed)
- Visit `http://skeleton-local-preview.lvh.me` (API health at `/healthz`)

### Multi-repo Traefik routing (previews)

- Hostnames and volume names derive from `COMPOSE_PROJECT_NAME`. In CI preview deploys, we namespace this as `<repo>-<branch>` (slashes → dashes, lowercased) to avoid collisions across repos and PRs sharing the same branch name.
- Set `HOST_DOMAIN` to control the base domain for Traefik host rules (default `lvh.me`). For previews in the wild, set `HOST_DOMAIN=preview.example.com` and add a wildcard DNS to the droplet.
- Keep a single Traefik instance running on the host (via `docker-compose.proxy.yml`) and reuse its `web_proxy` network from every app stack. Do not start additional Traefik instances binding :80/:443.

Feel free to extend this skeleton by adding CI jobs for testing, integrating more packages, or swapping the auth layer. The defaults are intentionally simple so you can move fast while keeping type-safety throughout the stack.
