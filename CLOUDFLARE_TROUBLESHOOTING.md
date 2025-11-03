# Cloudflare Pages 500 Error - Troubleshooting Guide

## Problem

Your application is getting a `net::ERR_HTTP_RESPONSE_CODE_FAILURE 500 (Internal Server Error)` on Cloudflare Pages deployment at `https://10xdevs-85k.pages.dev/`.

## Root Cause

**Missing environment variables in Cloudflare Pages production environment.**

The application requires `SUPABASE_URL` and `SUPABASE_KEY` to initialize the Supabase client. These variables are:

- ✅ Present in your local `.env` file (pointing to local Supabase)
- ❌ **Missing in Cloudflare Pages environment variables**

## Solution

### Step 1: Add Environment Variables to Cloudflare Pages

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to: **Pages** → **10xdevs-85k** → **Settings** → **Environment variables**
3. Click **"Add variable"** under **Production** section
4. Add the following variables:

   **Variable 1:**
   - Name: `SUPABASE_URL`
   - Value: `https://fjirvtvjcnxqsbesbqcx.supabase.co`

   **Variable 2:**
   - Name: `SUPABASE_KEY`
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqaXJ2dHZqY254cXNiZXNicWN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4Mjg4MzAsImV4cCI6MjA3NTQwNDgzMH0.J7EuSO5damT_pIj1vm196Ci5FLEFBHKVyxQJyAouqPY`

   **Optional (for admin operations):**
   - Name: `SUPABASE_SERVICE_ROLE_KEY`
   - Value: Get from Supabase Dashboard → Project Settings → API → service_role key

5. Click **"Save"**

### Step 2: Trigger a New Deployment

After adding the environment variables, you need to redeploy:

**Option A: Push a new commit**

```bash
git commit --allow-empty -m "Trigger redeploy for env vars"
git push origin master
```

**Option B: Manual redeploy from dashboard**

1. Go to **Deployments** tab in Cloudflare Pages
2. Find the latest deployment
3. Click **"···"** (three dots) → **"Retry deployment"**

### Step 3: Verify the Fix

1. Wait for deployment to complete (usually 1-2 minutes)
2. Visit `https://10xdevs-85k.pages.dev/`
3. The site should now load without 500 errors

## Verification Checklist

- [ ] Environment variables added to Cloudflare Pages (Production)
- [ ] New deployment triggered
- [ ] Deployment completed successfully
- [ ] Site loads without 500 error
- [ ] Can navigate to login/register pages
- [ ] Authentication works correctly

## Additional Notes

### Preview Deployments

If you also want environment variables for preview deployments (branches/PRs):

1. In **Environment variables** section, switch to **Preview** tab
2. Add the same variables there
3. This ensures feature branches work correctly

### Local Development

Your local development uses different Supabase credentials:

- **Local (.env)**: Points to `http://127.0.0.1:54321` (local Supabase)
- **Production (Cloudflare)**: Points to `https://fjirvtvjcnxqsbesbqcx.supabase.co`

This is correct! Keep using local Supabase for development.

### Common Mistakes

❌ **Don't** commit production credentials to `.env` file
✅ **Do** set them in Cloudflare Pages dashboard

❌ **Don't** use local Supabase URL in production
✅ **Do** use production Supabase URL (`https://...supabase.co`)

### Error Messages

After the fix, if you see:

- **Error: "Missing required Supabase environment variables"** → Check if variables are set correctly
- **Error: "Invalid API key"** → Verify the SUPABASE_KEY value
- **Error: "fetch failed"** → Check SUPABASE_URL is correct

## Build vs Runtime

- ✅ **Build**: Passes locally because `.env` file exists
- ✅ **Build on Cloudflare**: Should pass (uses build-time env vars)
- ❌ **Runtime on Cloudflare**: Fails because runtime env vars are missing

This is why you see the 500 error only when accessing the deployed site.

## Resources

- [Cloudflare Pages Environment Variables](https://developers.cloudflare.com/pages/configuration/build-configuration/#environment-variables)
- [Astro Environment Variables](https://docs.astro.build/en/guides/environment-variables/)
- [Supabase API Keys](https://supabase.com/docs/guides/api#api-keys)
