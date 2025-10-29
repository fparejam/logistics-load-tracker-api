# How to Set Up GitHub Actions Secrets

Follow these steps to configure the required secrets for automatic deployment.

## Step-by-Step Guide

### 1. Get Your Secrets

Before adding to GitHub, you need to collect your secrets:

#### A. Convex Deploy Key
1. Go to https://dashboard.convex.dev
2. Sign in to your account
3. Select your **production** project (not dev)
4. Click on **Settings** in the left sidebar
5. Scroll down to **Deploy Keys** section
6. Click **Create Deploy Key** (make sure it's for **Production**, not Preview)
7. Copy the entire key - it will look something like:
   ```
   prod_abc123xyz789...
   ```
   - **IMPORTANT**: Copy the ENTIRE key (usually a long string)
   - Make sure you copy it all in one go
   - Save it somewhere safe temporarily

#### B. Fly.io API Token

**Option 1: Personal Token (if not using SSO)**
1. Go to https://fly.io/user/personal_access_tokens
2. Sign in with your Fly.io account
3. Click **Create Token**
4. Give it a name like "GitHub Actions"
5. Copy the token (you'll only see it once!)
6. Save it somewhere safe temporarily

**Option 2: Organization Token (if using SSO - Required)**
If you get an SSO error, you need to create an organization token instead:

1. **Find your organization name:**
   ```bash
   flyctl orgs list
   ```
   Or check in Fly.io dashboard → Your app → Settings

2. **Create the organization token:**
   ```bash
   flyctl tokens create org <organization-name>
   ```
   Replace `<organization-name>` with your actual org name (e.g., `my-company`)
   
3. **Copy the token** - it will be displayed in the terminal
   - Save it somewhere safe temporarily
   - The token should start with something like `fly_at_...`

**Note**: Organization tokens work the same as personal tokens in GitHub Actions

#### C. Convex Production URL
1. Go to https://dashboard.convex.dev
2. Select your **production** project
3. In the **Settings** → **General** tab
4. Find **Deployment URL** or **Production URL**
5. It should look like: `https://your-project-name.convex.cloud`
6. Copy the entire URL

### 2. Add Secrets to GitHub

#### Option 1: Via GitHub Web Interface (Recommended)

1. **Go to your repository on GitHub**
   - Navigate to: `https://github.com/YOUR_USERNAME/YOUR_REPO_NAME`

2. **Access Settings**
   - Click on the **Settings** tab (top menu bar)
   - If you don't see Settings, you might not have admin access - ask the repo owner

3. **Navigate to Secrets**
   - In the left sidebar, click **Secrets and variables**
   - Then click **Actions**

4. **Add Each Secret**
   Click **New repository secret** for each one:

   **Secret 1: CONVEX_DEPLOY_KEY**
   - Name: `CONVEX_DEPLOY_KEY`
   - Value: Paste the Convex deploy key you copied
   - Click **Add secret**

   **Secret 2: FLY_API_TOKEN**
   - Name: `FLY_API_TOKEN`
   - Value: Paste the Fly.io token you copied
   - Click **Add secret**

   **Secret 3: VITE_CONVEX_URL**
   - Name: `VITE_CONVEX_URL`
   - Value: Paste your Convex production URL (e.g., `https://your-project.convex.cloud`)
   - Click **Add secret**

5. **Verify Secrets**
   - You should now see all three secrets listed:
     - `CONVEX_DEPLOY_KEY`
     - `FLY_API_TOKEN`
     - `VITE_CONVEX_URL`
   - Note: Once saved, you can't view the values again (they show as `••••••`)

#### Option 2: Via GitHub CLI (Advanced)

If you have GitHub CLI installed:

```bash
# Set Convex Deploy Key
gh secret set CONVEX_DEPLOY_KEY --repo YOUR_USERNAME/YOUR_REPO_NAME

# Set Fly.io Token
gh secret set FLY_API_TOKEN --repo YOUR_USERNAME/YOUR_REPO_NAME

# Set Convex URL
gh secret set VITE_CONVEX_URL --repo YOUR_USERNAME/YOUR_REPO_NAME
```

## Troubleshooting

### "CONVEX_DEPLOY_KEY secret is not set"
- Make sure the secret name is **exactly** `CONVEX_DEPLOY_KEY` (case-sensitive)
- No spaces before or after the name
- Verify it's saved: Go to Settings → Secrets → Actions and check it's listed

### "Invalid deploy key"
- Make sure you created a **Production** deploy key, not Preview
- Copy the entire key (some are very long - make sure you got it all)
- Try creating a new deploy key if the old one might have expired

### "FLY_API_TOKEN authentication failed"
- Make sure your Fly.io token hasn't expired
- Create a new token if needed
- Verify the token is correct (no extra spaces when copying)

### Secrets not appearing in workflow
- Make sure you're adding them to the **repository** secrets (not organization secrets)
- Repository secrets are under: Settings → Secrets and variables → Actions → Repository secrets
- Wait a minute after adding - GitHub sometimes needs a moment to propagate

## Security Best Practices

- ✅ Never commit secrets to your repository
- ✅ Rotate secrets regularly (especially after team members leave)
- ✅ Use Production deploy keys for production deployments
- ✅ Don't share secrets in screenshots or logs
- ✅ If a secret is compromised, regenerate it immediately

## Verifying Your Setup

Once all secrets are added, you can verify by:

1. Go to your repository → **Actions** tab
2. Find the latest workflow run (or trigger a new one by pushing to main)
3. Click on the workflow run
4. Click on the **Deploy Convex Functions** job
5. Look for: `🔑 Deploy key is set` - this confirms the secret is detected

## Next Steps

After setting up secrets:
1. Push a commit to `main` branch
2. Watch the Actions tab to see the deployment
3. Check that both jobs complete successfully:
   - ✅ Deploy Convex Functions
   - ✅ Deploy to Fly.io

If you see any errors, check the workflow logs for specific error messages.

