# Quick Deploy Guide - Privacy Features

## The Error You're Seeing

The `user_role` type already exists from your initial database setup. **This is normal!** Our new privacy migrations don't touch existing types - they only add new tables and functions.

## Solution: Use Supabase CLI (Recommended!)

The best way to deploy is with Supabase CLI - it's already configured!

### Step 1: Link Your Project (First Time Only)

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project (get ref from Supabase Dashboard → Settings)
supabase link --project-ref YOUR_PROJECT_REF
```

### Step 2: Push Privacy Migrations

```bash
# This will apply all pending migrations automatically
npm run migrate:privacy

# Or directly:
supabase db push
```

This pushes these 5 new privacy migrations:
- ✅ Data privacy enhancements
- ✅ Consent management
- ✅ Consignor privacy
- ✅ Tenant audit triggers
- ✅ Automated retention

This runs ONLY the 5 new privacy migration files:
- ✅ 033_data_privacy_enhancements.sql
- ✅ 034_privacy_consent.sql  
- ✅ 035_consignor_privacy.sql
- ✅ 036_tenant_audit_triggers.sql
- ✅ 037_automated_retention.sql

### Step 3: Generate Cron Secret

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 4: Add to Vercel

Go to Vercel Dashboard → Your Project → Settings → Environment Variables:

```
CRON_SECRET = <paste-secret-here>
PRIVACY_STRICT_LOGGING = true
```

### Step 5: Deploy

```bash
git add .
git commit -m "Add privacy features"
git push origin main
```

Or deploy directly:
```bash
vercel --prod
```

### Step 6: Test

Visit: `https://your-domain.com/account/privacy`

## If You Get Errors

### "relation already exists"
**Cause**: Table already created  
**Fix**: It's safe to ignore - the migration uses `CREATE TABLE IF NOT EXISTS`

### "function already exists"  
**Cause**: Function was already created
**Fix**: It's safe - the migration uses `CREATE OR REPLACE FUNCTION`

### "column already exists"
**Cause**: Column was added before
**Fix**: It's safe - the migration uses `ADD COLUMN IF NOT EXISTS`

## Verify Success

```bash
npm run verify:deployment
```

Should show:
- ✅ All 6 new tables created
- ✅ Default consent types seeded
- ✅ Retention policies created
- ✅ Functions exist

## Manual Verification (via Supabase SQL Editor)

```sql
-- Check new tables
SELECT table_name FROM information_schema.tables 
WHERE table_name IN (
  'data_exports', 'account_deletions', 'consent_types',
  'user_consents', 'retention_policies', 'tenant_isolation_alerts'
);
-- Should return 6 rows

-- Check consent types
SELECT code, name FROM consent_types;
-- Should return 6 consent types

-- Check retention policies  
SELECT policy_name, retention_days FROM retention_policies;
-- Should return 7 policies
```

## What If I Already Ran all_migrations.sql?

No problem! The error is harmless. Just run the individual privacy migrations:

```bash
# Run each one individually
psql $DATABASE_URL -f sql/033_data_privacy_enhancements.sql
psql $DATABASE_URL -f sql/034_privacy_consent.sql  
psql $DATABASE_URL -f sql/035_consignor_privacy.sql
psql $DATABASE_URL -f sql/036_tenant_audit_triggers.sql
psql $DATABASE_URL -f sql/037_automated_retention.sql
```

## Post-Deployment Test

```bash
# Test data export
curl https://your-domain.com/api/account/export-data \
  -H "Cookie: your-session-cookie"

# Test cron (replace YOUR_SECRET)
curl https://your-domain.com/api/cron/data-retention/cleanup \
  -H "Authorization: Bearer YOUR_SECRET"
```

## That's It! 🎉

Your privacy features are now live:
- `/account/privacy` - Privacy dashboard
- `/consignor/portal` - Consignor portal  
- Data export, deletion, consent management all working

## Need Help?

Common issues in the migration script will show helpful error messages. All migrations use safe `IF NOT EXISTS` patterns, so running them multiple times is safe.
