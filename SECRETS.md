# Required GitHub Secrets

To enable automated deployments, you must configure the following secrets in your GitHub repository settings.

## Preview Environment
Used by `scripts/deploy-preview.sh` and `scripts/cleanup-preview.sh`.

| Secret Name | Description | Example |
|---|---|---|
| `PREVIEW_SSH_HOST` | IP address or hostname of your preview droplet. | `192.0.2.1` |
| `PREVIEW_SSH_USER` | SSH username for the preview droplet. | `root` |
| `PREVIEW_SSH_KEY` | Private SSH key (PEM format) authorized to log in as the user. | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `HOST_DOMAIN` | (Optional) Base domain for preview deployments. If not set, defaults to `lvh.me`. | `sotongcove.com` |

## Production Environment
Used by `scripts/deploy-prod.sh`.

| Secret Name | Description | Example |
|---|---|---|
| `PRODUCTION_SSH_HOST` | IP address or hostname of your production droplet. | `198.51.100.1` |
| `PRODUCTION_SSH_USER` | SSH username for the production droplet. | `root` |
| `PRODUCTION_SSH_KEY` | Private SSH key (PEM format) authorized to log in as the user. | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `PRODUCTION_HOST_DOMAIN`| Base domain for the production environment. | `example.com` |
| `PRODUCTION_SLUG` | (Optional) Subdomain for production. Defaults to `{repo}-prod`. | `todo` |

## Registry (Optional)
If you are using a private registry other than GHCR (which is auto-configured), or if you need to pull from a different repo.

| Secret Name | Description |
|---|---|
| `REGISTRY_USER` | Username for the container registry. |
| `REGISTRY_TOKEN` | Password or token for the container registry. |
