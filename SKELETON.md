# Music Tools Architecture Guide

This repository serves as a base for building music theory and practice tools. It is designed to be extensible while sharing a common infrastructure for deployments and database management.

## 🚀 Quick Start: Creating a New App

1.  **Clone the Skeleton** (into a new directory name):
    ```bash
    git clone https://github.com/acme/skeleton.git my-new-hobby-app
    cd my-new-hobby-app
    ```

2.  **Run the Setup Script:**
    This script will remove the old git history, initialize a new git repo, and set up the `skeleton` remote for future updates.
    ```bash
    ./scripts/setup-project.sh
    ```

3.  **Install and Initialize:**
    Use the setup helper to install dependencies and start the local database.
    ```bash
    pnpm setup
    ```

4.  **Push to a New Repository:**
    Create a new empty repository on GitHub (e.g., `acme/my-new-hobby-app`) and push:
    ```bash
    git remote add origin https://github.com/acme/my-new-hobby-app.git
    git add .
    git commit -m "Initial commit from skeleton"
    git push -u origin main
    ```

---

## 🔄 Syncing Updates from Skeleton

Since your new app is a **Polyrepo** (independent repository) but keeps a link to the Skeleton, you can pull in infrastructure updates (e.g., better Dockerfiles, CI fixes, shared utility improvements).

To sync changes from the Skeleton:

```bash
# 1. Fetch the latest changes from the skeleton remote
git fetch skeleton

# 2. Merge them into your current branch
git merge skeleton/main --allow-unrelated-histories
```

*Note: You may encounter merge conflicts if you have heavily modified the core files. This is normal. Resolve them as you would any other merge.*

---

## 🏗️ Architecture & Naming

### The `@acme` Scope
To make syncing possible, **we do not rename the packages**.
All apps (whether it's `hobby-app-1` or `newsletter`) will continue to use:
*   `@acme/db`
*   `@acme/common`
*   `@acme/api`

**Why?**
If you rename `@acme/db` to `@hobby1/db`, every time you pull updates from the Skeleton (which still has `@acme/db`), you will get massive file conflicts. Keeping the generic `@acme` scope allows you to share code improvements seamlessly.

### Database "Skeleton" Name
Similarly, the internal Postgres database name inside Docker is always `skeleton`.
*   This is **isolated** per project (each project runs in its own container network).
*   You do not need to change this.

---

## 🚢 Deployment Setup

The CI/CD pipeline (`.github/workflows/ci.yml`) is designed to be generic. It uses your GitHub Repository name to generate unique Docker image tags and deployment paths.

### Requirements for Deployment
For the CI pipeline to work in your new repository, you must add the following **Secrets** in GitHub (Settings > Secrets and variables > Actions):

| Secret Name | Description |
| :--- | :--- |
| `PREVIEW_SSH_HOST` | IP address of your VPS (Preview/Staging) |
| `PREVIEW_SSH_USER` | SSH Username (e.g., `root` or `deploy`) |
| `PREVIEW_SSH_KEY` | SSH Private Key for the VPS |
| `PRODUCTION_SSH_HOST` | IP address of your VPS (Production) |
| `PRODUCTION_SSH_USER` | SSH Username |
| `PRODUCTION_SSH_KEY` | SSH Private Key |
| `PRODUCTION_HOST_DOMAIN` | The root domain for prod (e.g., `myapp.com`). Subdomains like `api.myapp.com` are generated automatically. |

*Note: If you use the same VPS for everything, the Host/User/Key values will be identical for Preview and Production.*

### How it works on the Server
When you deploy `acme/my-new-app`, the scripts will:
1.  Create a directory: `/var/www/skeleton-prod/acme-my-new-app-prod`
2.  Start Docker containers named: `acme-my-new-app-prod-web`, `acme-my-new-app-prod-db`, etc.

This ensures multiple hobby apps can run side-by-side on the same VPS without conflict.
