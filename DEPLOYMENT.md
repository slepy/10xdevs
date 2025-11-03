# Deployment Guide

## Cloudflare Pages Deployment

### Environment Variables Setup

The application requires the following environment variables to be set in Cloudflare Pages:

#### Production Environment Variables

Navigate to: **Cloudflare Dashboard** → **Pages** → **10xdevs-85k** → **Settings** → **Environment variables**

Add these variables:

- `SUPABASE_URL` - Your Supabase project URL
  - Production: `https://fjirvtvjcnxqsbesbqcx.supabase.co`
  
- `SUPABASE_KEY` - Your Supabase anon/public key
  - Get from: Supabase Dashboard → Project Settings → API → anon/public key

### Common Issues

#### 500 Internal Server Error

**Cause**: Missing or incorrect environment variables in Cloudflare Pages.

**Solution**:

1. Verify environment variables are set correctly in Cloudflare Pages dashboard
2. Make sure you're using production Supabase credentials, not local ones
3. Trigger a new deployment after adding/updating environment variables

#### Local Development vs Production

- **Local Development (.env)**: Uses local Supabase instance (`http://127.0.0.1:54321`)
- **Cloudflare Pages (.dev.vars)**: Uses production Supabase credentials
- **Production (Cloudflare env vars)**: Set via dashboard, not in repository

### Deployment Process

1. **Push to GitHub**: Changes are automatically deployed via GitHub integration
2. **Manual Redeploy**: Use "Retry deployment" in Cloudflare Pages dashboard
3. **Preview Deployments**: Created automatically for branches and pull requests

### Testing Before Deployment

```bash
# Build for production
npm run build

# Preview production build locally
npm run preview
```

### Cloudflare Adapter Configuration

The project uses `@astrojs/cloudflare` adapter configured in `astro.config.mjs`:

```javascript
adapter: cloudflare({
  platformProxy: {
    enabled: true,
  },
})
```

### Environment Validation

The application validates required environment variables at build time using Astro's env schema:

```javascript
env: {
  schema: {
    SUPABASE_URL: envField.string({ context: "server", access: "secret" }),
    SUPABASE_KEY: envField.string({ context: "server", access: "secret" }),
  },
  validateSecrets: true,
}
```

If environment variables are missing or invalid, the build will fail with a clear error message.
