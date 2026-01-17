# Deploy Privacy Features - Quick Guide

## You're Seeing This Message:

```
Found local migration files to be inserted before the last migration on remote database.
Rerun the command with --include-all flag to apply these migrations
```

## What This Means

Supabase CLI detected local migrations that haven't been applied yet. This is **normal and safe**!

## Solution: Apply All Migrations

```bash
# Apply all pending migrations (including privacy features)
supabase db push --include-all
```

This will apply:
1. Any pending local migrations
2. All 5 new privacy migrations
3. In the correct timestamp order

## Alternative: Use Linked Remote

If you want to sync with your remote database first:

```bash
# Pull remote migrations to local
supabase db pull

# Then push everything
supabase db push
```

## Verify Success

After running the command, you should see:

```
✔ Applying migration 20260114144216_remote_schema.sql...
✔ Applying migration 20260117200000_data_privacy_enhancements.sql...
✔ Applying migration 20260117200001_privacy_consent.sql...
✔ Applying migration 20260117200002_consignor_privacy.sql...
✔ Applying migration 20260117200003_tenant_audit_triggers.sql...
✔ Applying migration 20260117200004_automated_retention.sql...
Finished supabase db push.
```

## Check What Was Applied

```bash
# View migration history
supabase db status

# Or check in database
supabase db execute -c "SELECT version, name FROM supabase_migrations.schema_migrations ORDER BY version DESC LIMIT 10;"
```

## Next Steps

Once migrations are applied:

```bash
# 1. Generate TypeScript types
npm run db:types

# 2. Deploy to Vercel
vercel --prod
```

## Add Environment Variable to Vercel

```bash
# Generate secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Then add to Vercel Dashboard:
# CRON_SECRET = <your-generated-secret>
# PRIVACY_STRICT_LOGGING = true
```

## Test After Deployment

```
✅ Visit: https://your-domain.com/account/privacy
✅ Test data export
✅ Verify cron jobs in Vercel dashboard
```

---

**TL;DR**: Just run `supabase db push --include-all` and you're done! 🚀
