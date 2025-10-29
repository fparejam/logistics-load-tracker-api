# GitHub Actions Workflows

This directory contains CI/CD workflows for automatic deployment.

## Setup Required Secrets

To enable automatic deployments, you need to configure the following secrets in your GitHub repository:

### 1. Go to GitHub Repository Settings
- Navigate to: `Settings` → `Secrets and variables` → `Actions`
- Click `New repository secret` for each secret below

### 2. Required Secrets

#### `FLY_API_TOKEN`
- **What it is**: Your Fly.io API token for deploying applications
- **How to get it**:
  ```bash
  flyctl auth token
  ```
- Or visit: https://fly.io/user/personal_access_tokens
- Copy the token and add it as a GitHub secret

#### `VITE_CONVEX_URL`
- **What it is**: Your Convex production deployment URL
- **How to get it**: 
  - Run `npx convex deploy --prod` and copy the deployment URL
  - Or check your Convex dashboard: https://dashboard.convex.dev
  - Format: `https://your-project-name.convex.cloud`
- **Note**: This is used as a build argument for the Docker build, so Vite can embed it at build time

#### `CONVEX_DEPLOY_KEY`
- **What it is**: Your Convex deploy key for CI/CD deployments
- **How to get it**:
  1. Go to your Convex dashboard: https://dashboard.convex.dev
  2. Navigate to your project
  3. Go to `Settings` → `Deploy Keys`
  4. Click `Create Deploy Key`
  5. Copy the key and add it as a GitHub secret
- **Note**: This allows GitHub Actions to deploy Convex functions without interactive login

### 3. Verify Secrets
After adding all secrets, verify they're set:
- Go to `Settings` → `Secrets and variables` → `Actions`
- You should see: `FLY_API_TOKEN`, `VITE_CONVEX_URL`, and `CONVEX_DEPLOY_KEY`

## How It Works

When you push code to the `main` branch:

1. **Deploy Convex Functions** (Job 1)
   - Checks out the code
   - Installs dependencies
   - Deploys Convex functions to production using `bunx convex deploy --prod`

2. **Deploy to Fly.io** (Job 2, runs after Convex)
   - Checks out the code
   - Sets up Fly.io CLI
   - Builds and deploys the Docker image to Fly.io
   - Uses `VITE_CONVEX_URL` as a build argument so Vite embeds it
   - Verifies the deployment status

## Manual Deployment

If you want to deploy manually:

```bash
# Deploy Convex first
npx convex deploy --prod

# Then deploy to Fly.io
flyctl deploy --build-arg VITE_CONVEX_URL=your-convex-url
```

## Troubleshooting

### Workflow fails on "Deploy Convex"
- Check that `CONVEX_DEPLOY_KEY` is set correctly
- Verify the deploy key hasn't expired
- Make sure you're using a production deploy key (not dev)

### Workflow fails on "Deploy to Fly.io"
- Check that `FLY_API_TOKEN` is valid
- Verify `VITE_CONVEX_URL` is set and is the production URL (not dev)
- Check Fly.io logs: `flyctl logs`

### Build fails with missing VITE_CONVEX_URL
- Ensure `VITE_CONVEX_URL` secret is set in GitHub
- The workflow passes it as a build argument automatically

