#!/usr/bin/env bash
set -euo pipefail

# Start Postgres locally with the dev override that exposes 5432.
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d db
