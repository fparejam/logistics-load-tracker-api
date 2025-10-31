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

  **For personal accounts:**
  ```bash
  flyctl auth token
  ```
  Or visit: https://fly.io/user/personal_access_tokens

  **For organizations with SSO (if you get SSO error):**
  ```bash
  # First, find your organization name
  flyctl orgs list
  
  # Then create an organization token
  flyctl tokens create org <organization-name>
  ```
  Replace `<organization-name>` with your actual org name.

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
  2. Navigate to your project (select the **production** deployment, not dev)
  3. Go to `Settings` → `Deploy Keys`
  4. Click `Create Deploy Key` for **Production** (not Preview)
  5. Copy the entire key (starts with something like `prod_` or similar)
  6. Add it as a GitHub secret with the exact name `CONVEX_DEPLOY_KEY`
- **Important Notes**:
  - Must be a **Production Deploy Key**, not a Preview Deploy Key
  - Copy the entire key exactly as shown (no spaces, no extra characters)
  - The key should automatically be detected by `convex deploy` when set as `CONVEX_DEPLOY_KEY`

#### `VITE_MAPBOX_API_TOKEN`
- **What it is**: Your Mapbox API token for map visualizations
- **How to get it**: 
  - Go to https://account.mapbox.com
  - Navigate to **Account** → **Access tokens**
  - Copy your default public token

#### `VITE_AG_CHARTS_LICENSE`
- **What it is**: AG Charts license key for chart rendering
- **How to get it**: 
  - Get from your AG Charts account if you have a license
  - Or use a trial/evaluation license key

### 3. Verify Secrets
After adding all secrets, verify they're set:
- Go to `Settings` → `Secrets and variables` → `Actions`
- You should see all 5 secrets:
  - `CONVEX_DEPLOY_KEY`
  - `FLY_API_TOKEN`
  - `VITE_CONVEX_URL`
  - `VITE_MAPBOX_API_TOKEN`
  - `VITE_AG_CHARTS_LICENSE`

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
   - Uses build secrets (`VITE_CONVEX_URL`, `VITE_MAPBOX_API_TOKEN`, `VITE_AG_CHARTS_LICENSE`) so Vite embeds them at build time
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
- Verify all build secrets are set: `VITE_CONVEX_URL`, `VITE_MAPBOX_API_TOKEN`, `VITE_AG_CHARTS_LICENSE`
- Ensure secrets are production values (not dev)
- Check Fly.io logs: `flyctl logs`

### Build fails with missing build secrets
- Ensure all three build secrets are set in GitHub:
  - `VITE_CONVEX_URL`
  - `VITE_MAPBOX_API_TOKEN`
  - `VITE_AG_CHARTS_LICENSE`
- The workflow passes these as build arguments automatically during deployment

