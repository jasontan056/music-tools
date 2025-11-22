#!/usr/bin/env bash
set -euo pipefail

# -----------------------------------------------------------------------------
# scripts/setup-project.sh
#
# This script transforms the cloned skeleton into a new independent project.
# It handles git re-initialization, dependency installation, and remote setup.
# -----------------------------------------------------------------------------

SKELETON_REMOTE_URL="https://github.com/acme/skeleton.git"

echo "🚀 Starting project setup..."

# 1. Check if we are in a git repo
if [ -d ".git" ]; then
  echo "📦 Found existing .git directory."
  read -p "   Do you want to remove it and start a fresh git history? (y/N) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "   Removing .git directory..."
    rm -rf .git
    echo "   Initializing new git repository..."
    git init
    echo "   Adding skeleton remote for future updates..."
    git remote add skeleton "$SKELETON_REMOTE_URL"
    echo "   Done."
  else
    echo "   Skipping git re-initialization."
  fi
else
  echo "📦 No .git directory found. Initializing..."
  git init
  git remote add skeleton "$SKELETON_REMOTE_URL"
fi

# 2. Setup Environment Variables
if [ ! -f ".env" ]; then
  echo "📝 Copying .env.example to .env..."
  cp .env.example .env
else
  echo "📝 .env already exists. Skipping..."
fi

# 3. Install Dependencies
if command -v pnpm &> /dev/null; then
  echo "📦 Installing dependencies with pnpm..."
  pnpm install
else
  echo "❌ pnpm not found. Please install pnpm to proceed."
  exit 1
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update .env with your real secrets (if needed)."
echo "2. Run 'pnpm dev' to start the development server."
echo "3. Commit your changes: 'git add . && git commit -m \"Initial commit\"'"
echo "4. Create a new repo on GitHub and push: 'git remote add origin ...'"
