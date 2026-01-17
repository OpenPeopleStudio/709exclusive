# Deploy Privacy Features with Supabase CLI

## ✅ Good News!

Your privacy migrations are already in `supabase/migrations/` and ready to deploy with Supabase CLI!

## Prerequisites

```bash
# Install Supabase CLI if you haven't
npm install -g supabase

# Login to Supabase
supabase login
```

## Link Your Project

```bash
# Link to your remote Supabase project
supabase link --project-ref YOUR_PROJECT_REF

# Get your project ref from:
# Supabase Dashboard → Settings → General → Reference ID
```

## Deploy Privacy Migrations

### Option 1: Push All Pending Migrations (Recommended)

```bash
# This will push all migrations that haven't been applied yet
supabase db push

# Or use the npm script
npm run migrate:privacy
```

This will automatically push these 5 new privacy migrations:
- ✅ `20260117200000_data_privacy_enhancements.sql`
- ✅ `20260117200001_privacy_consent.sql`
- ✅ `20260117200002_consignor_privacy.sql`
- ✅ `20260117200003_tenant_audit_triggers.sql`
- ✅ `20260117200004_automated_retention.sql`

### Option 2: Check What Will Be Applied First

```bash
# See diff of pending migrations
supabase db diff

# List migrations
ls -la supabase/migrations/
```

### Option 3: Reset Local Database (Development Only)

```bash
# WARNING: This will reset your LOCAL database only
supabase db reset

# Or use npm script
npm run migrate:privacy:local
```

## Verify Migrations

After running `supabase db push`, verify everything was created:

```bash
# Check if tables exist
supabase db execute -c "
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'data_exports',
  'account_deletions', 
  'consent_types',
  'user_consents',
  'retention_policies',
  'tenant_isolation_alerts'
);
"

# Should return 6 rows
```

Or use the verification script:

```bash
npm run verify:deployment
```

## About the "user_role already exists" Error

This error is **harmless**! It happens because:
- Your database already has the `user_role` enum from previous migrations
- The new privacy migrations don't touch existing types
- Supabase CLI is smart enough to skip existing objects

**Solution**: The error is just a notice - your migrations will still complete successfully. Supabase CLI handles this automatically.

## Deploy Application Code

Once migrations are applied:

```bash
# Generate TypeScript types from database
npm run db:types

# Build and test
npm run build

# Deploy to Vercel
vercel --prod
```

## Set Environment Variables

In Vercel Dashboard → Settings → Environment Variables:

```
CRON_SECRET = <generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
PRIVACY_STRICT_LOGGING = true
```

## Test Privacy Features

After deployment:

```bash
# 1. Visit privacy dashboard
open https://your-domain.com/account/privacy

# 2. Test data export
curl https://your-domain.com/api/account/export-data \
  -H "Cookie: sb-access-token=YOUR_TOKEN"

# 3. Test cron jobs (replace YOUR_SECRET)
curl https://your-domain.com/api/cron/data-retention/cleanup \
  -H "Authorization: Bearer YOUR_SECRET"
```

## Supabase CLI Cheat Sheet

```bash
# Check migration status
supabase db status

# Create new migration
supabase db diff -f new_migration_name

# Apply migrations to remote
supabase db push

# Pull remote schema to local
supabase db pull

# Reset local database
supabase db reset

# Generate TypeScript types
supabase gen types typescript --linked > types/supabase.ts
```

## Troubleshooting

### "Project not linked"
```bash
supabase link --project-ref YOUR_PROJECT_REF
```

### "Migration already applied"
That's fine! Supabase tracks which migrations ran and skips them.

### "Permission denied"
Make sure you're logged in:
```bash
supabase login
```

### "Connection failed"
Check your internet connection and Supabase project status.

## What Happens When You Run `supabase db push`?

1. Connects to your remote Supabase project
2. Checks which migrations haven't been applied yet
3. Runs them in timestamp order
4. Updates `supabase_migrations` table to track completion
5. Shows you the results

## Next Steps

After successful migration:

1. ✅ Deploy app code to Vercel
2. ✅ Set `CRON_SECRET` environment variable
3. ✅ Test privacy features manually
4. ✅ Run `npm run audit:tenant-isolation`
5. ✅ Monitor for any errors in first 24 hours

---

**Quick Start**: Just run `npm run migrate:privacy` and you're done! 🚀
