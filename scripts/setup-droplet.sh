#!/usr/bin/env bash
set -euo pipefail

# scripts/setup-droplet.sh
#
# Provisions a fresh Ubuntu server for Skeleton3 deployments.
# Installs Docker, creates the proxy network, and starts Traefik.

# 1. Install Docker
if ! command -v docker &> /dev/null; then
  echo "🐳 Installing Docker..."
  curl -fsSL https://get.docker.com -o get-docker.sh
  sh get-docker.sh
  rm get-docker.sh
else
  echo "✅ Docker already installed."
fi

# 2. Create Proxy Network
if ! docker network inspect web_proxy &> /dev/null; then
  echo "🌐 Creating 'web_proxy' network..."
  docker network create web_proxy
else
  echo "✅ 'web_proxy' network already exists."
fi

# 3. Setup Traefik
echo "🚦 Setting up Traefik..."
if [ ! -f "docker-compose.proxy.yml" ]; then
  echo "❌ docker-compose.proxy.yml not found in current directory."
  echo "   Please upload it to the server before running this script."
  exit 1
fi

# Create acme.json if it doesn't exist
if [ ! -f "acme.json" ]; then
  touch acme.json
  chmod 600 acme.json
fi

# Configure ACME Email
if [ ! -f ".env" ] || ! grep -q "ACME_EMAIL" ".env"; then
  echo "📧 Let's Encrypt requires an email for urgent renewal notices."
  read -p "   Enter your email address (or press Enter to skip): " ACME_EMAIL
  if [ -n "$ACME_EMAIL" ]; then
    echo "ACME_EMAIL=$ACME_EMAIL" >> .env
    echo "✅ Saved to .env"
  fi
fi

docker compose -f docker-compose.proxy.yml up -d traefik

echo "✨ Droplet setup complete!"
echo "   Traefik is running on ports 80 and 443."
