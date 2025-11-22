#!/bin/bash
set -e

# Function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

echo "🚀 Initializing development environment..."

# 1. Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# 2. Start Docker services
if command_exists docker; then
  echo "🐳 Starting Docker services..."
  docker compose up -d db

  # Wait for Postgres to be ready (simple sleep for now, or wait-for-it approach)
  echo "⏳ Waiting for database to be ready..."
  sleep 5
else
  echo "⚠️ Docker not found. Please start the database manually."
  exit 1
fi

# 3. Setup Environment Variables
echo "⚙️  Setting up environment variables..."
if [ ! -f .env ]; then
  cp .env.example .env
  echo "  ✅ Created root .env"
else
  echo "  ℹ️  Root .env already exists"
fi

if [ ! -f packages/db/.env ]; then
  cp .env.example packages/db/.env
  echo "  ✅ Created packages/db/.env"
else
  echo "  ℹ️  packages/db/.env already exists"
fi

# 4. Database Bootstrap
echo "🗄️  Bootstrapping database..."
echo "  🔄 Generating Prisma client..."
pnpm db:generate

echo "  ⬆️  Pushing database schema..."
pnpm --filter @acme/db db:push

echo "  🌱 Seeding database..."
pnpm --filter @acme/db db:seed

echo "✅ Development environment initialized!"
echo "run 'pnpm dev' to start the servers."
