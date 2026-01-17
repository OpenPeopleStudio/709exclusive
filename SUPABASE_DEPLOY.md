# Deploy with Supabase CLI

The recommended way to deploy privacy features using Supabase's migration system.

## Prerequisites

Install Supabase CLI if you haven't:
```bash
npm install -g supabase
```

## Step 1: Login to Supabase

```bash
supabase login
```

## Step 2: Link to Your Project

```bash
supabase link --project-ref your-project-ref
```

**Get your project ref from:**
- Supabase Dashboard → Project Settings → General → Reference ID

Or list your projects:
```bash
supabase projects list
```

## Step 3: Check Migration Status

```bash
supabase db diff --schema public
```

This shows what will be migrated.

## Step 4: Push Migrations to Database

```bash
supabase db push
```

This will apply all new migrations in `supabase/migrations/`:
- ✅ `20260117200000_data_privacy_enhancements.sql`
- ✅ `20260117200001_privacy_consent.sql`
- ✅ `20260117200002_consignor_privacy.sql`
- ✅ `20260117200003_tenant_audit_triggers.sql`
- ✅ `20260117200004_automated_retention.sql`

**Note:** Supabase tracks which migrations have been applied, so it won't re-run old ones.

## Step 5: Verify Migrations

```bash
# Check migration history
supabase migration list

# Check database schema
supabase db diff
```

## Alternative: Apply Migrations One at a Time

If you want more control:

```bash
# Apply specific migration
supabase db push --include-name 20260117200000_data_privacy_enhancements.sql

# Or use SQL editor
supabase db execute --file supabase/migrations/20260117200000_data_privacy_enhancements.sql
```

## Step 6: Generate TypeScript Types (Optional)

```bash
supabase gen types typescript --local > types/supabase.ts
```

## Step 7: Deploy Application Code

```bash
# Add environment variables to Vercel
# CRON_SECRET = <generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
# PRIVACY_STRICT_LOGGING = true

# Deploy
vercel --prod
```

## Rollback a Migration (if needed)

```bash
# List migrations
supabase migration list

# Repair migration history (if needed)
supabase migration repair <version> --status reverted
```

## Local Development

Test migrations locally before pushing to production:

```bash
# Start local Supabase
supabase start

# Apply migrations locally
supabase db reset

# Test your app against local database
npm run dev

# When ready, push to production
supabase db push
```

## Common Issues

### "Migration already applied"
**Cause:** Migration was already run  
**Fix:** This is normal - Supabase skips already-applied migrations

### "Schema drift detected"
**Cause:** Database has changes not in migration files  
**Fix:** 
```bash
# Create migration from current database state
supabase db diff -f new_migration

# Or reset to match migrations
supabase db reset
```

### "Connection refused"
**Cause:** Not linked to project  
**Fix:**
```bash
supabase link --project-ref your-project-ref
```

## Verify Success

After pushing migrations:

```sql
-- In Supabase SQL Editor, run:
SELECT table_name FROM information_schema.tables 
WHERE table_name IN (
  'data_exports',
  'account_deletions', 
  'consent_types',
  'user_consents',
  'retention_policies',
  'tenant_isolation_alerts'
);
-- Should return 6 tables

-- Check consent types
SELECT code, name FROM consent_types;
-- Should return 6 rows

-- Check retention policies
SELECT policy_name, retention_days FROM retention_policies;
-- Should return 7 rows
```

## Next Steps

1. ✅ Migrations applied
2. Set environment variables in Vercel
3. Deploy application code
4. Test at `/account/privacy`
5. Set up cron jobs (vercel.json already configured)

## Benefits of Supabase CLI

- ✅ Tracks migration history automatically
- ✅ Won't re-run applied migrations
- ✅ Version control for schema changes
- ✅ Easy rollback if needed
- ✅ Works with team workflows
- ✅ Integrated with Supabase Dashboard

---

**That's it!** Your privacy features are now deployed using Supabase's official migration system.
